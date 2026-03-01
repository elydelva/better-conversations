better-conversation / whitepaper / v0.3-draft

# better-_conversation_

DRAFT v0.3 · Policy system

Un moteur de messagerie **headless, pur TypeScript**, sans dépendance framework ni DB. Il expose des interfaces. Vous fournissez les implémentations. Même philosophie que better-auth — mais pour les conversations : chatters, blocks typés, threads, hooks de pipeline, permissions, et désormais un **système de policies** multi-niveaux (global, rôle, chatter, conversation, thread) avec résolution par priorité. Zéro serveur supplémentaire. Zéro coupling HTTP.

corepure TS, zero deps

blocks par défauttext uniquement

blocks additionnelsplugins opt-in

hookspipeline avec outcomes

policiesmulti-niveaux + merge

adaptersDrizzle · Prisma · Mongo

01

## Architecture _core_

**Le principe fondamental :** le core de better-conversation ne sait pas ce qu'est Express, Next.js, Drizzle, ou PostgreSQL. Il ne les importe jamais. Il travaille exclusivement avec des **interfaces TypeScript** que le consommateur injecte via la config. L'équivalent d'une Clean Architecture appliquée à un package npm.

**Règle d'or :** si un import dans `better-conversation/core` référence un framework, un ORM, ou un runtime Node spécifique — c'est un bug. Le core doit tourner dans Node, Bun, Deno, Edge, ou un worker sans modification.

### Couches du package

core/

Engine pur. Interfaces. Pipeline de hooks. Logique de permissions. Zero import externe. Testable sans DB ni HTTP.

adapters/

Implémentations concrètes des interfaces core. Drizzle, Prisma, MongoDB. Chaque adapter est un package séparé.

handlers/

Ponts HTTP optionnels. Next.js, Hono, Express. Prennent un `ConversationEngine` et exposent des routes. Complètement optionnels.

blocks/

Block plugins opt-in. `better-conversation/blocks/media`, `/reaction`, etc. Chacun enrichit le registre de types du core. Enregistré en DB via `createBlock()`.

roles/

Role plugins opt-in. `better-conversation/roles/moderator`, `/admin`, etc. Chacun porte une policy et s'enregistre en DB. Assignable à un participant. Typesafe via `createRole()`.

client/

SDK browser type-safe. Fetch les endpoints du handler. Connait les types des blocks et rôles installés grâce à la généricité.

plugins/

Extensions de comportement : realtime (SSE, WS), audit log, rate limiting, archival automatique.

### Interface principale — DatabaseAdapter

Le core définit cette interface. L'adapter l'implémente. Le core ne connaît que cette interface.

```
better-conversation/core/adapter.ts// ─── TOUT ce que le core demande à la DB ───────────────────
// Aucune dépendance ORM ou driver ici.

export interface DatabaseAdapter {
  // Chatters
  chatters: {
    find(id: string): Promise<Chatter | null>
    findByEntity(type: string, id: string): Promise<Chatter | null>
    create(data: ChatterInput): Promise<Chatter>
    update(id: string, data: Partial<ChatterInput>): Promise<Chatter>
  }

  // Conversations
  conversations: {
    find(id: string): Promise<Conversation | null>
    findByEntity(type: string, id: string): Promise<Conversation[]>
    list(filters: ConversationFilters): Promise<Paginated<Conversation>>
    create(data: ConversationInput): Promise<Conversation>
    update(id: string, data: Partial<Conversation>): Promise<Conversation>
  }

  // Participants
  participants: {
    list(conversationId: string): Promise<Participant[]>
    find(conversationId: string, chatterId: string): Promise<Participant | null>
    add(data: ParticipantInput): Promise<Participant>
    update(id: string, data: Partial<Participant>): Promise<Participant>
    remove(id: string): Promise<void>
  }

  // Blocks
  blocks: {
    find(id: string): Promise<Block | null>
    list(filters: BlockFilters): Promise<Paginated<Block>>
    create(data: BlockInput): Promise<Block>
    update(id: string, data: Partial<Block>): Promise<Block>
    softDelete(id: string): Promise<void>
  }

  // Permissions
  permissions: {
    check(chatterId: string, action: string, scope?: string): Promise<boolean>
    grant(chatterId: string, action: string, scope?: string): Promise<void>
    revoke(chatterId: string, action: string, scope?: string): Promise<void>
  }
}
```

### ConversationEngine — le cœur injecté

```
better-conversation/core/engine.tsexport class ConversationEngine<
  TBlocks extends BlockRegistry = DefaultBlockRegistry,
  TRoles  extends RoleRegistry  = DefaultRoleRegistry,
> {
  constructor(private readonly config: ConversationConfig<TBlocks, TRoles>) {}

  // L'engine opère uniquement via config.adapter (DatabaseAdapter)
  // Il ne sait pas si c'est Drizzle, Prisma, ou un mock in-memory.
  // Il orchestre la logique, valide, passe par les hooks.
}
```

### Config — le point d'entrée unique

```
better-conversation/core/config.tsexport interface ConversationConfig<
  TBlocks extends BlockRegistry,
  TRoles  extends RoleRegistry,
> {
  /** Implémentation de l'accès DB — fournie par l'adapter */
  adapter: DatabaseAdapter

  /** Blocks supplémentaires au-delà du text built-in */
  additionalBlocks?: TBlocks

  /** Rôles supplémentaires au-delà du rôle member built-in */
  additionalRoles?: TRoles

  /** Hooks de pipeline — voir section 03 */
  hooks?: ConversationHooks<TBlocks, TRoles>

  /** Système de policies — voir section 09 */
  policies?: PolicyConfig<TRoles>

  /** Plugins (realtime, audit, rate-limit...) */
  plugins?: ConversationPlugin[]

  /** Préfixe des tables en DB */
  tablePrefix?: string  // default: "bc_"

  /** Génération des IDs — override possible (cuid2 par défaut) */
  generateId?: () => string
}
```

02

## Blocks — _registry & createBlock_

Un block est l'unité atomique de contenu. Le core ne shippe qu'un seul block built-in : `text`. Tout le reste est un plugin opt-in importé depuis `better-conversation/blocks/*`. Il n'existe aucun block lié à un domaine métier dans le package — pas de `price_proposal`, pas de `order_status`. Ces blocks-là, **tu les crées toi-même avec `createBlock()`**.

**DB-safe par défaut :** chaque block enregistré via `additionalBlocks` est inscrit dans la table `bc_block_registry` au démarrage de l'engine. La colonne `bc_blocks.type` est validée contre ce registre à l'écriture — enum virtuel géré par le core, sans migration nécessaire à chaque ajout de block custom.

### Block built-in : text default

```
// Activé automatiquement, aucune config nécessaire.
// C'est le seul block que le core connaît nativement.
await engine.blocks.send({
  conversationId: "conv_abc",
  authorId:       "chatter_xyz",
  type:           "text",
  body:           "Bonjour, le vélo est toujours dispo ?",
  metadata: { format: "markdown" }  // optionnel
})
```

### Blocks additionnels — plugins opt-in plugin

/blocks/media

Image, fichier, vidéo. URL, mimetype, dimensions.

/blocks/reaction

Emoji reaction sur un block cible.

/blocks/embed

URL preview rich (og:tags). Lien, titre, image.

/blocks/poll

Sondage rapide multi-choix avec votes.

```
lib/conversation.tsimport { betterConversation }     from "better-conversation"
import { drizzleAdapter }        from "better-conversation/adapters/drizzle"
import { mediaBlock }            from "better-conversation/blocks/media"
import { reactionBlock }         from "better-conversation/blocks/reaction"
import { moderatorRole }         from "better-conversation/roles/moderator"
import { adminRole }             from "better-conversation/roles/admin"
import { priceProposalBlock }    from "./blocks/price-proposal"  // block custom
import { sellerRole }            from "./roles/seller"           // rôle custom

export const conv = betterConversation({
  adapter: drizzleAdapter(db, { provider: "pg" }),
  additionalBlocks: {
    media:          mediaBlock,
    reaction:       reactionBlock,
    price_proposal: priceProposalBlock,
  },
  additionalRoles: {
    moderator: moderatorRole,
    admin:     adminRole,
    seller:    sellerRole,          // rôle custom typé
  }
})
```

### createBlock() — blocs custom typés avec Zod user-defined

La fonction `createBlock` est le seul moyen de créer un block custom. Elle prend un schéma Zod pour les `metadata`, ce qui garantit la validation à l'entrée et l'inférence de type bout-en-bout — du SDK client jusqu'à la DB.

```
./blocks/price-proposal.tsimport { createBlock } from "better-conversation"
import { z }           from "zod"

export const priceProposalBlock = createBlock({
  /** Identifiant unique du type. Stocké tel quel en DB. */
  type: "price_proposal",

  /** Schéma Zod des metadata — validé à l'écriture ET inféré en lecture */
  schema: z.object({
    amount:      z.number().positive(),
    currency:    z.string().length(3),
    status:      z.enum(["pending", "accepted", "declined", "expired"]),
    expiresAt:   z.string().datetime().optional(),
    respondedAt: z.string().datetime().optional(),
    respondedBy: z.string().optional(),   // chatterId
  }),

  /** Hooks spécifiques à ce block (optionnel) */
  hooks: {
    beforeSend: async (ctx, { next, refuse }) => {
      if (ctx.block.metadata.amount <= 0)
        return refuse("Amount must be positive")

      // Un seul price_proposal pending à la fois par conv ?
      const existing = await ctx.adapter.blocks.list({
        conversationId: ctx.conversationId,
        type: "price_proposal",
        metadataFilter: { status: "pending" }
      })
      if (existing.items.length > 0)
        return refuse("A pending proposal already exists", { code: "DUPLICATE_PROPOSAL" })

      return next()
    }
  }
})
```

### Inférence de type end-to-end

```
// Le type de retour de blocks.send() est automatiquement typé
// selon les blocks installés dans additionalBlocks

const block = await conv.blocks.send({
  conversationId: "conv_abc",
  authorId:       "chatter_xyz",
  type:           "price_proposal",
  body:           "Offre à 120€",
  metadata: {
    amount:   120,      // ✓ TypeScript sait que c'est number
    currency: "EUR",   // ✓ string de 3 chars
    status:   "pending"  // ✓ l'enum est inféré
    // currency: "EURO"   ✗ TypeScript error (length 4)
  }
})

block.metadata.status  // type: "pending" | "accepted" | "declined" | "expired"
block.metadata.amount  // type: number
```

### Structure d'un block en DB

bc\_blocks ├─ id varchar(36) PK ├─ conversationId varchar(36) FK ├─ authorId varchar(36) FK → bc\_chatters.id ├─ type varchar(128) \-- "text" | "media" | "price\_proposal" | ... ├─ body text NULL ├─ metadata jsonb NULL \-- validé par le schema Zod du block ├─ threadParentId varchar(36) NULL → bc\_blocks.id ├─ status enum: published|pending\_review|refused|deleted ├─ refusalReason text NULL \-- si status=refused par un hook ├─ flaggedAt timestamp NULL \-- si flaggé par un hook ├─ editedAt timestamp NULL └─ createdAt timestamp NOT NULL

03

## Hook system — _pipeline & outcomes_

Chaque action du core passe par un pipeline de hooks. Un hook reçoit un contexte et un objet **d'outcomes** — des fonctions qui décident du résultat de l'action. Inspiré du `next()` d'Express, mais enrichi pour la modération et l'enrichissement de données.

### Pipeline d'un block:send

inputSDK call

→

corevalidation schema

→

corepermission check

→

hookblock.beforeSend

→

hook (block)type.beforeSend

→

coreadapter.blocks.create

→

hookblock.afterSend

→

outputBlock

### Les outcomes — que peut faire un hook ?

next()

Laisse passer l'action. Continue le pipeline. Le comportement par défaut si aucun hook ne répond.

refuse(reason, opts?)

Bloque l'action. L'appelant reçoit une erreur. En modération : le block est enregistré avec `status: "refused"`.

transform(data)

Modifie le block avant persistence. Sanitize le body, enrichit les metadata, normalise le type. Continue le pipeline.

flag(reason)

Laisse passer, mais marque le block pour review humaine. `flaggedAt` est set. Continue le pipeline.

defer(asyncFn)

Continue le pipeline maintenant, mais exécute `asyncFn` après la réponse. Logging, webhooks, notifs.

queue()

Block enregistré en `status: "pending_review"`. Invisible aux participants jusqu'à validation manuelle.

### Tous les hooks disponibles

```
better-conversation/core/hooks.tsexport interface ConversationHooks<TBlocks> {

  // ─── BLOCKS ────────────────────────────────────────────────

  /**
   * Avant la persistence d'un block.
   * Idéal pour : modération de contenu, rate limiting, enrichissement.
   */
  onBlockBeforeSend?: (
    ctx:      BlockBeforeSendCtx<TBlocks>,
    outcomes: BlockOutcomes<TBlocks>
  ) => Promise<HookResult>

  /**
   * Après la persistence. Side-effects uniquement.
   * Idéal pour : notifications push, webhooks, realtime emit.
   * Ne peut pas bloquer — outcomes limités à defer().
   */
  onBlockAfterSend?: (
    ctx: BlockAfterSendCtx<TBlocks>
  ) => Promise<void>

  /**
   * Avant soft-delete. Peut refuser (ex: block pas au bon status).
   */
  onBlockBeforeDelete?: (
    ctx:      BlockDeleteCtx,
    outcomes: DeleteOutcomes
  ) => Promise<HookResult>

  // ─── CONVERSATIONS ─────────────────────────────────────────

  onConversationBeforeCreate?: (
    ctx:      ConversationCreateCtx,
    outcomes: ConversationOutcomes
  ) => Promise<HookResult>

  onConversationAfterCreate?: (
    ctx: ConversationAfterCreateCtx
  ) => Promise<void>

  onConversationStatusChange?: (
    ctx:      StatusChangeCtx,  // previousStatus, nextStatus
    outcomes: StatusOutcomes
  ) => Promise<HookResult>

  // ─── PARTICIPANTS ──────────────────────────────────────────

  onParticipantBeforeJoin?: (
    ctx:      ParticipantJoinCtx,
    outcomes: ParticipantOutcomes
  ) => Promise<HookResult>

  onParticipantAfterJoin?: (
    ctx: ParticipantJoinCtx
  ) => Promise<void>

  onParticipantBeforeLeave?: (
    ctx:      ParticipantLeaveCtx,
    outcomes: ParticipantOutcomes
  ) => Promise<HookResult>

  // ─── THREADS ───────────────────────────────────────────────

  /**
   * Déclenché quand un block avec threadParentId est créé
   * ET que c'est le premier reply (nouveau thread).
   */
  onThreadCreated?: (
    ctx:      ThreadCreatedCtx,
    outcomes: BlockOutcomes<TBlocks>
  ) => Promise<HookResult>
}
```

### Contexte d'un hook block

```
interface BlockBeforeSendCtx<TBlocks> {
  block:          BlockInput<TBlocks>    // le block en cours (non persisté)
  conversation:   Conversation
  author:         Chatter
  participants:   Participant[]
  adapter:        DatabaseAdapter        // accès DB pour requêtes contextuelles
  isThread:       boolean
  isFirstReply:   boolean               // si ça crée un nouveau thread
}
```

### Exemples concrets de hooks

#### Modération — refuser les URLs suspectes

```
const conv = betterConversation({
  adapter: drizzleAdapter(db),
  hooks: {
    onBlockBeforeSend: async (ctx, { next, refuse, flag, transform }) => {
      if (ctx.block.type !== "text") return next()

      // Détection de spam basique
      const hasSpamUrl = /(bit\.ly|tinyurl|t\.co)/.test(ctx.block.body ?? "")
      if (hasSpamUrl) return flag("suspicious_url")  // passe, mais marqué

      // Modération IA externe (appel async)
      const score = await moderateText(ctx.block.body)
      if (score > 0.9) return refuse("content_policy_violation", {
        code: "MODERATION_REFUSED",
        expose: true   // l'erreur est renvoyée au client
      })

      // Sanitize : strip HTML
      return transform({
        ...ctx.block,
        body: stripHtml(ctx.block.body)
      })
    }
  }
})
```

#### Rate limiting — anti-flood

```
    onBlockBeforeSend: async (ctx, { next, refuse }) => {
      const recent = await ctx.adapter.blocks.list({
        conversationId: ctx.conversation.id,
        authorId:       ctx.author.id,
        after:          new Date(Date.now() - 60_000)  // dernière minute
      })
      if (recent.total >= 20)
        return refuse("Too many messages", { code: "RATE_LIMIT", retryAfter: 60 })
      return next()
    }
```

#### Notification push — defer après envoi

```
    onBlockAfterSend: async (ctx) => {
      // Notifier tous les participants non-auteurs
      const recipients = ctx.participants
        .filter(p => p.chatterId !== ctx.author.id)

      for (const p of recipients) {
        await notificationService.push({
          to:      p.chatterId,
          title:   `Nouveau message de ${ctx.author.displayName}`,
          body:    ctx.block.body?.slice(0, 100) ?? "[media]",
          deepLink: `/messages/${ctx.conversation.id}`
        })
      }
    }
```

#### Archivage automatique — hook de statut

```
    onBlockBeforeSend: async (ctx, { next, refuse }) => {
      if (ctx.conversation.status === "archived")
        return refuse("Conversation is archived", { code: "CONV_ARCHIVED" })
      return next()
    },

    onConversationStatusChange: async (ctx, { next }) => {
      // Générer un system_event automatique quand une conv est archivée
      if (ctx.nextStatus === "archived") {
        await ctx.adapter.blocks.create({
          conversationId: ctx.conversation.id,
          authorId:       ctx.triggeredBy.id,
          type:           "system_event",
          metadata: {
            event:       "conversation_archived",
            triggeredBy: ctx.triggeredBy.id
          }
        })
      }
      return next()
    }
```

#### Escalade SAV — redirect vers autre conv

```
// Idée : un block avec un mot-clé "SAV" redirige dans une conv support
// (pattern pour aller plus loin — le hook crée la conv et y copie le block)
    onBlockBeforeSend: async (ctx, { next, transform }) => {
      if (ctx.block.body?.includes("#sav")) {
        // Créer une conv support si elle n'existe pas
        const supportConv = await getOrCreateSupportConversation(
          ctx.conversation, ctx.adapter
        )
        // Envoyer une copie dans la conv SAV
        await ctx.adapter.blocks.create({
          ...ctx.block,
          conversationId: supportConv.id,
          metadata: { escalatedFrom: ctx.conversation.id }
        })
      }
      return next()  // continue dans la conv originale aussi
    }
```

04

## Schéma _DB complet_

bc\_chatters ├─ id varchar(36) PK ├─ displayName varchar(255) ├─ avatarUrl text NULL ├─ entityType varchar(64) // user | member | org | bot | system | custom ├─ entityId varchar(255) NULL // soft FK externe — pas de contrainte DB ├─ metadata jsonb NULL ├─ isActive boolean DEFAULT true ├─ createdAt timestamp NOT NULL └─ updatedAt timestamp NOT NULL

bc\_conversations ├─ id varchar(36) PK ├─ title varchar(255) NULL ├─ status enum: open | archived | locked ├─ entityType varchar(64) NULL // "listing" | "order" | null ├─ entityId varchar(255) NULL // ID de l'annonce, commande, etc. ├─ createdBy varchar(36) → bc\_chatters.id ├─ metadata jsonb NULL ├─ createdAt timestamp NOT NULL └─ updatedAt timestamp NOT NULL

bc\_participants ├─ id varchar(36) PK ├─ conversationId varchar(36) → bc\_conversations.id ├─ chatterId varchar(36) → bc\_chatters.id ├─ role varchar(64) // validé vs bc\_role\_registry → owner | member | observer | bot | custom... ├─ joinedAt timestamp NOT NULL ├─ leftAt timestamp NULL ├─ lastReadAt timestamp NULL ├─ metadata jsonb NULL └─ UNIQUE (conversationId, chatterId)

bc\_blocks ├─ id varchar(36) PK ├─ conversationId varchar(36) → bc\_conversations.id ├─ authorId varchar(36) → bc\_chatters.id ├─ type varchar(128) // "text" | custom (ouvert) ├─ body text NULL ├─ metadata jsonb NULL // validé par le schema Zod du block type ├─ threadParentId varchar(36) NULL → bc\_blocks.id ├─ status enum: published | pending\_review | refused | deleted ├─ refusalReason text NULL // set par refuse() ├─ flaggedAt timestamp NULL // set par flag() ├─ editedAt timestamp NULL └─ createdAt timestamp NOT NULL

bc\_chatter\_permissions ├─ id varchar(36) PK ├─ chatterId varchar(36) → bc\_chatters.id ├─ action varchar(128) // "conversation:create" | "block:send" | ... ├─ scope varchar(255) NULL // NULL=global | "conversation:conv\_abc" └─ granted boolean DEFAULT true

### Table : `bc_block_registry`

bc\_block\_registry \-- Enregistrement automatique au démarrage de l'engine. -- Agit comme un enum virtuel : bc\_blocks.type est validé contre cette table. ├─ type varchar(128) PK // "text" | "media" | "price\_proposal" | ... ├─ schemaJson jsonb NOT NULL // snapshot du schema Zod sérialisé ├─ isBuiltIn boolean DEFAULT false // true pour "text" └─ registeredAt timestamp NOT NULL

### Table : `bc_role_registry`

bc\_role\_registry \-- Enregistrement automatique au démarrage de l'engine. -- bc\_participants.role est validé contre cette table à l'écriture. ├─ name varchar(64) PK // "member" | "owner" | "moderator" | ... ├─ extends varchar(64) NULL // héritage de policy (ex: "member") ├─ policy jsonb NOT NULL // PolicyObject partiel du rôle ├─ isBuiltIn boolean DEFAULT false // true pour owner/member/observer/bot └─ registeredAt timestamp NOT NULL

**Index recommandés :**  
`bc_blocks(conversationId, createdAt DESC)` — pagination chronologique  
`bc_blocks(threadParentId) WHERE threadParentId IS NOT NULL`  
`bc_blocks(conversationId, type, status)` — filtres composites (ex: pending proposals)  
`bc_conversations(entityType, entityId)` — lookup par entité externe  
`bc_participants(chatterId)` — "toutes mes convs"  
`bc_participants(conversationId, role)` — "tous les moderators d'une conv"

05

## Adapters — _implémentation de DatabaseAdapter_

Un adapter est simplement une fonction qui prend une instance DB configurée et retourne un objet conforme à `DatabaseAdapter`. Le core l'appelle via l'interface. Zéro import du framework côté core.

### Drizzle (Kysely sous le capot) Priorité 1

```
import { drizzleAdapter } from "better-conversation/adapters/drizzle"
import { db }            from "@/lib/db"

// PG
drizzleAdapter(db, { provider: "pg" })

// SQLite (Turso, libSQL, Bun)
drizzleAdapter(db, { provider: "sqlite" })

// MySQL / PlanetScale
drizzleAdapter(db, { provider: "mysql" })
```

**Kysely est utilisé en interne dans l'adapter Drizzle** pour les requêtes avancées (ex: `jsonb_path_query` sur les metadata, index conditionnels). Drizzle gère les migrations. Kysely gère l'exécution des queries complexes. Les deux coexistent sans conflit.

### Prisma Priorité 2

```
import { prismaAdapter } from "better-conversation/adapters/prisma"
import { prisma }        from "@/lib/prisma"

prismaAdapter(prisma)
// L'adapter génère le schema Prisma à ajouter à ton prisma.schema via un CLI
```

### MongoDB Priorité 3

```
import { mongoAdapter } from "better-conversation/adapters/mongodb"
import { client }       from "@/lib/mongo"

// Collections séparées recommandées (pas d'embed blocks dans conv)
mongoAdapter(client, { dbName: "myapp", embedBlocks: false })
```

### Custom adapter — mock in-memory pour tests

```
// Tu peux implémenter DatabaseAdapter toi-même pour les tests unitaires
// sans aucune DB réelle.
const memoryAdapter: DatabaseAdapter = {
  chatters:      createInMemoryChatters(),
  conversations: createInMemoryConversations(),
  participants:  createInMemoryParticipants(),
  blocks:        createInMemoryBlocks(),
  permissions:   createInMemoryPermissions(),
}

const engine = betterConversation({ adapter: memoryAdapter })

// test unitaire du hook de modération sans DB
it("refuses block with score > 0.9", async () => {
  await expect(engine.blocks.send({ body: "spam content", ... }))
    .rejects.toThrow("MODERATION_REFUSED")
})
```

### Mount framework-agnostic

```
// Next.js App Router
export const { GET, POST, PATCH, DELETE } = conv.handler()

// Hono
app.route("/conversation", conv.honoHandler())

// Express
app.use("/conversation", conv.expressHandler())

// Standalone (Bun, Deno, Node HTTP)
const { request } = conv.standaloneHandler()
Bun.serve({ fetch(req) { return request(req) } })
```

06

## SDK — _server & client_

### SDK serveur

```
import { conv } from "@/lib/conversation"

// ── chatters ─────────────────────────────────────────
const chatter  = await conv.chatters.create({ displayName, entityType: "user", entityId })
const existing = await conv.chatters.findByEntity("user", userId)

// ── conversations ─────────────────────────────────────
const chat = await conv.conversations.create({
  createdBy:    buyer.id,
  participants: [{ chatterId: buyer.id, role: "member" }, { chatterId: seller.id, role: "owner" }],
  entityType:   "listing",
  entityId:     listingId,
})
const found = await conv.conversations.findByEntity("listing", listingId)
await conv.conversations.archive(chat.id, { by: seller.id })

// ── blocks ────────────────────────────────────────────
await conv.blocks.send({ conversationId, authorId, type: "text", body: "Salut" })
await conv.blocks.send({ conversationId, authorId, type: "price_proposal",
  metadata: { amount: 120, currency: "EUR", status: "pending" }
})
const page = await conv.blocks.list(conversationId, { limit: 50, before: cursor })
await conv.blocks.updateMeta(blockId, { status: "accepted", respondedAt: new Date() })
await conv.blocks.delete(blockId)

// ── participants ─────────────────────────────────────
// role est typé : seuls les rôles enregistrés sont acceptés
await conv.participants.add(conversationId, { chatterId: agent.id, role: "moderator" })
await conv.participants.add(conversationId, { chatterId: seller.id, role: "seller" })
await conv.participants.remove(conversationId, buyer.id)
await conv.participants.markRead(conversationId, chatter.id)
// Changer le rôle d'un participant existant
await conv.participants.setRole(conversationId, chatterId, "observer")

// ── permissions ──────────────────────────────────────
await conv.permissions.grant(botId, "block:send:system")
const can = await conv.permissions.check(chatterId, "conversation:create")

// ── policies ──────────────────────────────────────────
// Lire la policy résolue d'un chatter (merge de tous les niveaux)
const resolved = await conv.policies.resolve(chatterId, conversationId)
// resolved.canJoinSelf     → false (server-invite only)
// resolved.allowedBlocks   → ["text", "media"]
// resolved.maxBlocksPerDay → 100

// Mettre à jour la policy globale
await conv.policies.setGlobal({ canJoinSelf: false, maxBlocksPerConversation: 1000 })

// Override pour un rôle
await conv.policies.setRole("moderator", { allowedBlocks: ["text", "media", "system_event"] })

// Override pour un chatter précis
await conv.policies.setChatter(chatterId, { maxBlocksPerMinute: 5 })

// Override pour une conversation (ex: conv SAV = bloquée en écriture)
await conv.policies.setConversation(conversationId, { readOnly: true })

// Override pour un thread (ex: thread fermé à de nouveaux messages)
await conv.policies.setThread(threadParentBlockId, { closed: true })
```

### SDK client (browser)

```
import { createConversationClient } from "better-conversation/client"
import type { conv }              from "@/lib/conversation"  // import de type uniquement

// Infer les types des blocks installés depuis le type de l'instance serveur
const client = createConversationClient<typeof conv>({
  baseUrl:   "/api/conversation",
  chatterId: currentChatterId,
})

// Même API que le SDK serveur — complètement typé
const blocks = await client.blocks.list(conversationId)
blocks.items[0].metadata  // typé selon le block type
```

07

## Endpoints _REST_

| Méthode | Path | Description |
| --- | --- | --- |
| Chatters |     |     |
| POST | /chatters | Créer un chatter |
| GET | /chatters/:id | Détail d'un chatter |
| PATCH | /chatters/:id | Update displayName / metadata |
| GET | /chatters/:id/conversations | Conversations d'un chatter (paginé) |
| Conversations |     |     |
| POST | /conversations | Créer + participants initiaux |
| GET | /conversations/:id | Détail + participants |
| PATCH | /conversations/:id | Update title / status / metadata |
| DELETE | /conversations/:id | Archive (soft) |
| GET | /conversations?entityType=listing&entityId=x | Lookup par entité externe |
| Participants |     |     |
| GET | /conversations/:id/participants | Liste (inclut leftAt) |
| POST | /conversations/:id/participants | Inviter un chatter |
| DELETE | /conversations/:id/participants/:chatterId | Quitter / éjecter |
| PATCH | /conversations/:id/participants/:chatterId/read | marquer lu (lastReadAt = now) |
| Blocks |     |     |
| GET | /conversations/:id/blocks | Pagination cursor-based (`before`, `after`, `limit`) |
| POST | /conversations/:id/blocks | Envoyer un block (passe par le pipeline de hooks) |
| PATCH | /conversations/:id/blocks/:blockId | Modifier body ou metadata |
| DELETE | /conversations/:id/blocks/:blockId | Soft-delete |
| GET | /conversations/:id/blocks/:blockId/thread | Thread d'un block parent |
| Permissions |     |     |
| GET | /chatters/:id/permissions | Liste des permissions d'un chatter |
| POST | /chatters/:id/permissions | Grant |
| DELETE | /chatters/:id/permissions/:action | Revoke |
| Policies  — server-side uniquement, pas d'accès client direct |     |     |
| GET | /policies | Policy globale active (résolution complète) |
| PATCH | /policies/global | Mettre à jour la policy globale |
| GET | /policies/roles | Lister les rôles et leurs policies |
| PATCH | /policies/roles/:role | Mettre à jour la policy d'un rôle |
| GET | /policies/chatters/:chatterId | Policy résolue pour un chatter (merge complet) |
| PATCH | /policies/chatters/:chatterId | Override de policy pour un chatter spécifique |
| PATCH | /policies/conversations/:id | Override de policy pour une conversation |
| PATCH | /policies/conversations/:id/threads/:blockId | Override de policy pour un thread |

08

## Principes _de design_

01 · Core pur

Aucun framework, ORM, ou runtime dans `core/`. Le core est testable sans DB, sans HTTP, avec un adapter in-memory.

02 · Interfaces-first

Le core dicte les interfaces. Les adapters les implémentent. Jamais l'inverse. Dependency inversion appliqué au package npm.

03 · Blocks = registry

Le core ne connaît que `text`. Chaque block additionnel enrichit le type registry. `createBlock()` est la seule porte d'entrée.

04 · Hooks = pipeline

Chaque action passe par un pipeline d'outcomes. `next()`, `refuse()`, `transform()`, `flag()`, `defer()`, `queue()`. Modération native.

05 · Zero vendor

Pas de service externe requis. Tout vit dans ta DB. Realtime = opt-in plugin, pas une dépendance de base.

06 · Type-safety bout en bout

Le type des metadata d'un block custom est inféré depuis `createBlock()` jusqu'au client browser sans cast.

07 · Policies = merge tree

Les règles d'autorisation se composent par niveaux. Plus le scope est précis, plus il prime. Les defaults sont safe, tout est opt-in permissif.

09

## Policies — _autorisation multi-niveaux_

Le système de policies répond à une question simple : **qui peut faire quoi, où, et dans quelle limite ?** Il est distinct des `permissions` (qui sont des grants binaires) — une policy est un **objet de règles composables**, résolu par merge à l'exécution selon une hiérarchie de priorité.

**Principe de base :** par défaut, tout est _safe et restrictif_. Un chatter ne peut pas rejoindre une conversation de lui-même, ne peut envoyer que des blocks `text`, et est soumis à un rate limit raisonnable. Toute ouverture est explicite.

### Hiérarchie de priorité — du plus global au plus précis

priorité 1 (la plus faible)global

→

priorité 2role

→

priorité 3chatter

→

priorité 4conversation

→

priorité 5 (la plus forte)thread

→

résultatResolvedPolicy

**Règle de merge :** chaque niveau surcharge les champs définis par le niveau précédent. Un champ `undefined` au niveau N signifie "hérite du niveau N-1". Un champ explicitement défini (même à `false` ou `0`) écrase. Le niveau thread est le seul à pouvoir uniquement _restreindre_ — il ne peut pas donner plus de droits qu'une policy de conversation.

### Interface PolicyObject — les règles disponibles

```
better-conversation/core/policy.tsexport interface PolicyObject {

  // ─── ACCÈS À LA CONVERSATION ───────────────────────────────

  /** Un chatter peut-il rejoindre seul via l'API client ? (default: false) */
  canJoinSelf?: boolean

  /** La conversation est-elle en lecture seule ? (default: false) */
  readOnly?: boolean

  /** Le thread est-il fermé à de nouveaux messages ? (default: false) */
  threadClosed?: boolean

  /** Nombre max de participants dans la conversation (default: undefined = illimité) */
  maxParticipants?: number

  // ─── BLOCKS : CE QU'ON PEUT ENVOYER ───────────────────────

  /**
   * Liste blanche des types de blocks autorisés.
   * default: ["text"] — seul le block built-in est autorisé.
   * Pour autoriser tout : allowedBlocks: "*"
   */
  allowedBlocks?: string[] | "*"

  /**
   * Liste noire — surcharge allowedBlocks.
   * Ex: autoriser "*" sauf les system_event.
   */
  deniedBlocks?: string[]

  /** Longueur max du body d'un block text (default: 4000 chars) */
  maxBlockBodyLength?: number

  /** Un chatter peut-il éditer ses propres blocks ? (default: true) */
  canEditOwnBlocks?: boolean

  /** Un chatter peut-il supprimer ses propres blocks ? (default: true) */
  canDeleteOwnBlocks?: boolean

  /** Délai max après envoi pour pouvoir éditer/supprimer (default: undefined = illimité) */
  editWindowSeconds?: number

  // ─── RATE LIMITS ──────────────────────────────────────────

  /** Nombre max de blocks par minute par chatter dans cette conversation (default: 20) */
  maxBlocksPerMinute?: number

  /** Nombre max de blocks par heure (default: 200) */
  maxBlocksPerHour?: number

  /** Nombre max de blocks par jour (default: undefined = illimité) */
  maxBlocksPerDay?: number

  /** Nombre max total de blocks dans la conversation (default: undefined = illimité) */
  maxBlocksPerConversation?: number

  /** Cooldown en ms entre deux envois consécutifs (default: 500) */
  sendCooldownMs?: number

  // ─── THREADS ──────────────────────────────────────────────

  /** Les threads sont-ils autorisés ? (default: true) */
  threadsEnabled?: boolean

  /** Profondeur max des threads (default: 1 — un seul niveau) */
  maxThreadDepth?: number

  /** Nombre max de replies dans un thread (default: undefined = illimité) */
  maxThreadReplies?: number
}
```

### Rôles built-in default

Le core shippe quatre rôles built-in enregistrés dans `bc_role_registry` avec `isBuiltIn: true`. Seul `member` est vraiment "par défaut" — c'est le rôle assigné si aucun autre n'est spécifié. Les trois autres doivent être explicitement assignés côté serveur.

member DEFAULT

Rôle par défaut. Text only, rate limit standard, edit window 5 min. Activé sans configuration.

owner

Peut tout faire dans la conversation. Archiver, éjecter. `allowedBlocks: "*"`. Rate limit élevé.

observer

Lecture seule. `readOnly: true`. Utile pour un agent SAV qui surveille sans intervenir.

bot

Envoie n'importe quel block type, pas de rate limit. Invitation serveur obligatoire.

### Rôles opt-in — packages `better-conversation/roles/*` plugin

Des rôles plus permissifs sont disponibles comme packages opt-in. Ils s'importent et s'enregistrent exactement comme des blocks additionnels — ajoutés dans `additionalRoles`.

/roles/moderator

Hérite de member. Accès system\_event, pas d'edit window, peut supprimer les blocks des autres.

/roles/admin

Hérite de moderator. Peut archiver, locker, gérer tous les participants. `allowedBlocks: "*"`.

/roles/guest

Plus restrictif que member. Text only, pas d'edit, pas de delete, cooldown 2s.

/roles/support

Hérite de observer. Peut envoyer des blocks system\_event. Conçu pour les agents SAV.

### createRole() — rôles custom typés & DB-safe user-defined

`createRole()` est la seule façon de définir un rôle custom. Le nom devient une entrée dans `bc_role_registry` via un upsert idempotent au démarrage de l'engine — et un membre de l'union type `Role` inféré dans tout le SDK. **Assigner un rôle non enregistré est une erreur TypeScript ET une erreur DB.**

```
./roles/seller.tsimport { createRole } from "better-conversation"

export const sellerRole = createRole({
  /** Clé unique — PK de bc_role_registry, validée à chaque assignation */
  name: "seller",

  /** Hérite de la policy de "member", surcharge uniquement les champs ci-dessous */
  extends: "member",

  policy: {
    allowedBlocks:      ["text", "media", "price_proposal"],
    maxBlocksPerMinute: 30,
    editWindowSeconds:  600,
    canDeleteOwnBlocks: true,
  }
})
```

### Typesafety — rôles comme enum TypeScript inféré

```
// Avec additionalRoles: { moderator, admin, seller, guest }
// le type Role est automatiquement inféré comme :
type Role = "member" | "owner" | "observer" | "bot"      // built-in
          | "moderator" | "admin" | "seller" | "guest"     // additionalRoles

// ✓ Compile + DB-safe
await conv.participants.add(convId, { chatterId, role: "seller" })

// ✗ TypeScript error — "superadmin" n'est pas dans le registre
await conv.participants.add(convId, { chatterId, role: "superadmin" })
//                                                         ^^^^^^^^^^ Type error

// ✗ DB error au runtime si le type bypass : bc_role_registry reject l'entrée inconnue

// De même pour les blocks — type "unknown_block" est refusé à la compilation et en DB :
await conv.blocks.send({ type: "unknown_block", ... })
//                              ^^^^^^^^^^^^^^^ Type error + bc_block_registry reject
```

### Enregistrement DB — séquence au démarrage de l'engine

```
// Au premier appel de betterConversation({ additionalRoles, additionalBlocks }),
// l'engine upsert chaque rôle et chaque block dans leurs tables de registre.
// Opération idempotente — pas de migration nécessaire à chaque ajout.

// Pour chaque role dans additionalRoles :
await adapter.upsert("bc_role_registry", {
  name:         "seller",
  extends:      "member",
  policy:       JSON.stringify(sellerRole.policy),
  isBuiltIn:    false,
  registeredAt: new Date(),
}, { onConflict: "name", update: ["policy", "extends"] })

// Pour chaque block dans additionalBlocks :
await adapter.upsert("bc_block_registry", {
  type:         "price_proposal",
  schemaJson:   zodToJson(priceProposalBlock.schema),
  isBuiltIn:    false,
  registeredAt: new Date(),
}, { onConflict: "type", update: ["schemaJson"] })
```

### Configuration complète dans betterConversation()

```
lib/conversation.tsexport const conv = betterConversation({
  adapter: drizzleAdapter(db),

  additionalBlocks: { media: mediaBlock, price_proposal: priceProposalBlock },
  additionalRoles:  { moderator: moderatorRole, seller: sellerRole },

  policies: {
    // ── Policy globale — s'applique à TOUS, tout le temps ────
    global: {
      canJoinSelf:          false,   // JAMAIS de self-join par API client
      allowedBlocks:        ["text"], // default safe
      maxBlockBodyLength:   4000,
      maxBlocksPerMinute:   20,
      maxBlocksPerHour:     200,
      sendCooldownMs:       500,
      threadsEnabled:       true,
      maxThreadDepth:       1,
    },

    // ── Policies par rôle — surcharge le global ──────────────
    // Les clés sont typées : seuls les rôles enregistrés sont acceptés
    roles: {
      member: {
        allowedBlocks: ["text", "media"],
      },
      owner: {
        maxBlocksPerMinute: 60,
        editWindowSeconds:  undefined,
      },
      // Les rôles additionalRoles sont disponibles ici avec leur type inféré
      moderator: moderatorRole.policy,
      seller:    sellerRole.policy,
    },

    mergeStrategy: "override",

    onResolve: async (resolved, ctx) => {
      if (ctx.chatter.metadata?.verified) {
        resolved.maxBlocksPerMinute = (resolved.maxBlocksPerMinute ?? 20) * 2
      }
      if (ctx.conversation?.status === "archived") {
        resolved.readOnly = true
      }
      return resolved
    }
  },
})
```

### Defaults par niveau — vue d'ensemble

| Règle | Global default | member | owner | bot | observer |
| --- | --- | --- | --- | --- | --- |
| canJoinSelf | false ❌ | false ❌ | false ❌ | false ❌ | false ❌ |
| allowedBlocks | \["text"\] | \["text"\] | "\*" | "\*" | \[\] (readOnly) |
| maxBlocksPerMinute | 20  | 20  | 60  | —   | —   |
| maxBlocksPerHour | 200 | 200 | —   | —   | —   |
| sendCooldownMs | 500ms | 500ms | 0   | 0   | —   |
| maxBlockBodyLength | 4000 | 4000 | 10000 | 10000 | —   |
| canEditOwnBlocks | true ✓ | true ✓ | true ✓ | false ❌ | —   |
| editWindowSeconds | 300 (5 min) | 300 | illimité | —   | —   |
| threadsEnabled | true ✓ | true ✓ | true ✓ | true ✓ | —   |
| maxThreadDepth | 1   | 1   | 1   | 1   | —   |
| readOnly | false | false | false | false | true ✓ |

**canJoinSelf = false partout, toujours.** Un chatter ne peut jamais rejoindre une conversation via l'API client directement. L'invitation doit passer par une **server action** appelant `conv.participants.add()` côté serveur. Aucune policy ne peut activer `canJoinSelf: true` au niveau conversation ou thread — c'est une restriction hard-coded du core, non overridable.

### Résolution step-by-step — exemple concret

```
// Contexte : chatter "alice" (role: member, metadata.verified: true)
// dans "conv_vip" (policy conv: { allowedBlocks: ["text","media","price_proposal"] })
// dans le thread "thread_xyz" (policy thread: { maxThreadReplies: 5 })

// 1 — global
{ allowedBlocks: ["text"], maxBlocksPerMinute: 20, editWindowSeconds: 300 }

// 2 — role:member (pas d'override ici) → inchangé

// 3 — chatter:alice (pas d'override custom) → inchangé

// 4 — conversation:conv_vip surcharge allowedBlocks
{ allowedBlocks: ["text","media","price_proposal"], maxBlocksPerMinute: 20, ... }

// 5 — thread:thread_xyz ajoute maxThreadReplies
{ ..., maxThreadReplies: 5 }

// 6 — onResolve() : alice est verified → maxBlocksPerMinute × 2
{ allowedBlocks: ["text","media","price_proposal"], maxBlocksPerMinute: 40, maxThreadReplies: 5 }
// ✓ ResolvedPolicy finale
```

### Integration dans le pipeline de hooks

La résolution de policy est transparente : elle se produit **automatiquement en amont du hook `onBlockBeforeSend`**. Si la policy refuse (rate limit, block type non autorisé, readOnly…), le pipeline est court-circuité avant même tes hooks custom. La `resolvedPolicy` est disponible dans le contexte de chaque hook.

```
    onBlockBeforeSend: async (ctx, { next }) => {
      // ctx.resolvedPolicy est déjà calculé — lecture seule ici
      const { maxBlocksPerMinute, blockCountLastMinute } = ctx

      // Alerte si on approche du rate limit (80%)
      if (blockCountLastMinute >= maxBlocksPerMinute * 0.8) {
        await warnRateLimit(ctx.author.id)
      }
      return next()
    }
```

### Schema DB — bc\_policies

bc\_policies ├─ id varchar(36) PK ├─ level enum: global | role | chatter | conversation | thread ├─ scopeId varchar(255) NULL // role name | chatterId | conversationId | blockId ├─ policy jsonb NOT NULL // PolicyObject partiel — seuls les champs définis ├─ createdAt timestamp NOT NULL └─ updatedAt timestamp NOT NULL UNIQUE (level, scopeId)

**Note :** la policy globale et les policies de rôles built-in peuvent être définies statiquement dans la config `betterConversation()` — elles ne transitent pas obligatoirement par la DB. La table `bc_policies` ne stocke que les overrides dynamiques (policies de chatters, conversations, threads).

10

## Roadmap _granulaire_

### v0.1 — Fondations terminé (concept)

| Item | Détail |
| --- | --- |
| Schéma DB initial | Tables bc\_chatters, bc\_conversations, bc\_participants, bc\_blocks |
| DatabaseAdapter interface | Interface core sans dépendance ORM ou framework |
| ConversationEngine | Instanciation via config, injection de l'adapter |
| Block text built-in | Seul block activé par défaut, zero config |
| Adapter Drizzle PG | Implémentation complète de DatabaseAdapter sur PostgreSQL |
| Endpoints REST CRUD | Chatters, conversations, participants, blocks — pagination cursor |
| SDK serveur v1 | API fluente autour de l'engine, typage strict |
| Handler Next.js App Router | Export GET/POST/PATCH/DELETE depuis un catch-all route |

### v0.2 — Core-first rewrite terminé (concept)

| Item | Détail |
| --- | --- |
| createBlock() | Factory typée avec schema Zod, hooks de block, inférence end-to-end |
| Block registry | Système d'enregistrement des blocks dans l'engine via additionalBlocks |
| Pipeline de hooks | onBlockBeforeSend, onBlockAfterSend, onConversationStatusChange, onParticipantBeforeJoin… |
| Outcomes hooks | next(), refuse(), transform(), flag(), defer(), queue() |
| Blocks opt-in packages | better-conversation/blocks/media, /reaction, /embed, /poll |
| Thread support | threadParentId, onThreadCreated, maxThreadDepth configurable |
| Adapter SQLite | Turso, libSQL, Bun:SQLite via Drizzle |
| Adapter MySQL | PlanetScale, Vitess, MySQL 8 via Drizzle |
| Handler Hono | Hono v4 compatible Edge Runtime |
| Handler Express | Express 4/5 middleware |
| Soft delete blocks | status: "deleted", body remplacé par null à la lecture |

### v0.3 — Policy system en cours (concept)

| Item | Détail |
| --- | --- |
| PolicyObject interface | Toutes les règles : accès, blocks, rate limits, edit window, threads |
| Merge engine | Résolution multi-niveaux global → role → chatter → conversation → thread |
| createRole() | Factory de rôles typés avec extends, policy partielle, inférence union type dans tout le SDK |
| bc\_role\_registry table | Enum virtuel DB — upsert idempotent au démarrage, validation de bc\_participants.role |
| bc\_block\_registry table | Enum virtuel DB — upsert idempotent au démarrage, validation de bc\_blocks.type |
| additionalRoles config | Enregistrement de rôles custom dans l'engine, inférence du type Role |
| Rôles opt-in packages | better-conversation/roles/moderator, /admin, /guest, /support |
| participants.setRole() | Changer le rôle d'un participant existant, validé contre le registre |
| Rôles built-in | owner, member, observer, bot — policies par défaut safe et documentées |
| canJoinSelf: false core | Restriction hard-coded, non overridable, self-join impossible par API client |
| bc\_policies table | Stockage des overrides dynamiques en DB (chatter, conversation, thread) |
| onResolve() hook | Customisation post-merge pour cas dynamiques (metadata, statut…) |
| ctx.resolvedPolicy | Policy résolue disponible dans tous les hooks before\* |
| Rate limit engine | Compteurs par minute/heure/jour, cooldown, via adapter.blocks.list() |
| Policy endpoints REST | /policies/global, /roles/:role, /chatters/:id, /conversations/:id, /threads/:id |
| conv.policies SDK | setGlobal(), setRole(), setChatter(), setConversation(), setThread(), resolve() |
| Adapter Prisma | Génération du schema Prisma additionnel via CLI, include bc\_policies |
| mergeStrategy: "restrict" | Mode alternatif : toujours choisir la valeur la plus restrictive entre niveaux |

### v0.4 — Realtime & client SDK planifié

| Item | Détail |
| --- | --- |
| Plugin SSE | Endpoint /conversations/:id/stream, ReadableStream, Edge-compatible |
| Plugin Pusher / Ably | Emit après chaque mutation (block:created, participant:joined, policy:updated…) |
| Plugin Supabase Realtime | Écoute Postgres replication sur bc\_blocks + bc\_participants |
| Plugin WebSocket | Via Hono WS, uWebSockets, ou ws npm |
| SDK client browser | createConversationClient<typeof conv> — API miroir du SDK serveur |
| React hooks | useConversation(), useBlocks(), useParticipants(), usePolicy() — poll + SSE |
| Optimistic updates | Block ajouté localement avant confirmation serveur, rollback si refuse() |
| Presence | isTyping, lastSeen — via SSE ou WebSocket selon le plugin actif |
| Pagination infinie | useInfiniteBlocks() avec virtualisation recommandée |

### v0.5 — Écosystème & production planifié

| Item | Détail |
| --- | --- |
| Adapter MongoDB | Collections séparées, index composites sur type+status+conversationId |
| Plugin better-auth | onUserCreated auto-crée un chatter, session → chatterId injecté dans le contexte |
| CLI migrations | bc migrate — génère les fichiers de migration Drizzle/Prisma/SQL brut |
| Plugin audit log | Journal immuable de toutes les mutations, queryable avec filtres |
| Rate limit Redis | Compteurs partagés en Redis pour les déploiements multi-instance / multi-region |
| Plugin archival automatique | Archive les conversations après N jours d'inactivité, configurable par policy |
| Plugin full-text search | PG ts\_vector sur bc\_blocks.body, ou MeiliSearch / Typesense adapter |
| Handler Fastify | Plugin Fastify v4/v5 avec schema JSON automatique |
| Export / backup | conv.export(conversationId) → JSON portable, conv.import() pour migration |
| Webhook plugin | Envoie un POST à une URL configurée sur chaque événement, avec signature HMAC |

### v1.0 — Stable API futur

| Item | Détail |
| --- | --- |
| Semver strict | Breaking changes uniquement en version majeure, changelog détaillé |
| Conformance test suite | Suite de tests publique pour valider un adapter custom contre le spec |
| Documentation site | Site interactif style better-auth.js.org — guides, API ref, playground |
| Policy playground | Sandbox en ligne : configurer des policies et simuler des résolutions |
| Performance benchmarks | Benchmark officiel PG / SQLite / Mongo sur blocks.list, blocks.create, resolve() |
| Security audit | Audit tiers du core et des adapters, notamment le merge engine et les rate limits |

better-conversation · whitepaper v0.3-draft core-first · hooks-first · blocks-as-plugins · policies-as-merge-tree