import { pgTable, pgEnum, pgSchema, AnyPgColumn, varchar, timestamp, text, integer, uniqueIndex, serial, uuid, foreignKey, boolean, primaryKey } from "drizzle-orm/pg-core"

export const keyStatus = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
export const keyType = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const factorType = pgEnum("factor_type", ['totp', 'webauthn'])
export const factorStatus = pgEnum("factor_status", ['unverified', 'verified'])
export const aalLevel = pgEnum("aal_level", ['aal1', 'aal2', 'aal3'])
export const codeChallengeMethod = pgEnum("code_challenge_method", ['s256', 'plain'])
export const voiceGroup = pgEnum("VoiceGroup", ['S1', 'S2', 'S2_M', 'A1_M', 'A1', 'A2', 'T1', 'T2', 'B1', 'B2', 'D'])
export const musicalKey = pgEnum("MusicalKey", ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'])
export const linkType = pgEnum("LinkType", ['Audio', 'AudioRecording', 'AudioPracticeTrack', 'AudioInitialNotes', 'Video', 'PDF', 'MuseScore', 'Other'])

import { sql } from "drizzle-orm"

export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar("id", { length: 36 }).primaryKey().notNull(),
	checksum: varchar("checksum", { length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true,  }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text("logs"),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true,  }),
	startedAt: timestamp("started_at", { withTimezone: true,  }).defaultNow().notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const googleDriveFile = pgTable("GoogleDriveFile", {
	id: text("id").primaryKey().notNull(),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	name: text("name").notNull(),
	mimeType: text("mimeType").notNull(),
	downloadUrl: text("downloadUrl").notNull(),
	lastSyncAt: timestamp("lastSyncAt", { precision: 6, withTimezone: true,  }).notNull(),
});

export const verificationToken = pgTable("VerificationToken", {
	id: serial("id").primaryKey().notNull(),
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { precision: 3,  }).notNull(),
},
(table) => {
	return {
		tokenKey: uniqueIndex("VerificationToken_token_key").on(table.token),
		identifierTokenKey: uniqueIndex("VerificationToken_identifier_token_key").on(table.identifier, table.token),
	}
});

export const user = pgTable("User", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	firstName: text("firstName").notNull(),
	lastName: text("lastName").notNull(),
	email: text("email"),
	passwordHash: text("passwordHash"),
	emailVerified: timestamp("emailVerified", { precision: 3,  }),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	image: text("image"),
},
(table) => {
	return {
		emailKey: uniqueIndex("User_email_key").on(table.email),
	}
});

export const account = pgTable("Account", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text("scope"),
	idToken: text("id_token"),
	sessionState: text("session_state"),
	oauthTokenSecret: text("oauth_token_secret"),
	oauthToken: text("oauth_token"),
},
(table) => {
	return {
		providerProviderAccountIdKey: uniqueIndex("Account_provider_provider_account_id_key").on(table.provider, table.providerAccountId),
	}
});

export const session = pgTable("Session", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	sessionToken: text("session_token").notNull(),
	userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	expires: timestamp("expires", { precision: 3,  }).notNull(),
},
(table) => {
	return {
		sessionTokenKey: uniqueIndex("Session_session_token_key").on(table.sessionToken),
	}
});

export const inviteToken = pgTable("InviteToken", {
	id: serial("id").primaryKey().notNull(),
	token: text("token").notNull(),
	used: boolean("used").default(false).notNull(),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	expires: timestamp("expires", { precision: 6, withTimezone: true,  }),
	usedAt: timestamp("usedAt", { precision: 6, withTimezone: true,  }),
	userId: uuid("user_id").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => {
	return {
		tokenKey: uniqueIndex("InviteToken_token_key").on(table.token),
		userIdKey: uniqueIndex("InviteToken_user_id_key").on(table.userId),
	}
});

export const event = pgTable("Event", {
	id: text("id").primaryKey().notNull(),
	summary: text("summary").notNull(),
	description: text("description"),
	location: text("location"),
	lastSyncAt: timestamp("lastSyncAt", { precision: 6, withTimezone: true,  }).notNull(),
	start: timestamp("start", { precision: 6, withTimezone: true,  }).notNull(),
	end: timestamp("end", { precision: 6, withTimezone: true,  }).notNull(),
});

export const singer = pgTable("Singer", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	firstName: text("firstName").notNull(),
	lastName: text("lastName").notNull(),
	email: text("email"),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	voiceGroup: voiceGroup("voiceGroup").notNull(),
},
(table) => {
	return {
		emailKey: uniqueIndex("Singer_email_key").on(table.email),
	}
});

export const song = pgTable("Song", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	name: text("name").notNull(),
	key: musicalKey("key"),
	lyrics: text("lyrics"),
	notes: text("notes"),
},
(table) => {
	return {
		nameKey: uniqueIndex("Song_name_key").on(table.name),
	}
});

export const setlist = pgTable("Setlist", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	name: text("name").notNull(),
	notes: text("notes"),
});

export const eventAttendance = pgTable("EventAttendance", {
	singerId: uuid("singerId").notNull().references(() => singer.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	eventId: text("eventId").notNull().references(() => event.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
},
(table) => {
	return {
		eventAttendancePkey: primaryKey(table.singerId, table.eventId)
	}
});

export const setlistSongInfo = pgTable("SetlistSongInfo", {
	setlistId: uuid("setlistId").notNull().references(() => setlist.id, { onDelete: "cascade" } ),
	songId: uuid("songId").notNull().references(() => song.id, { onDelete: "cascade" } ),
	order: integer("order").notNull(),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	notes: text("notes"),
},
(table) => {
	return {
		setlistSongInfoPkey: primaryKey(table.setlistId, table.songId, table.order)
	}
});

export const songFileLink = pgTable("SongFileLink", {
	songId: uuid("songId").notNull().references(() => song.id, { onDelete: "cascade" } ),
	createdAt: timestamp("createdAt", { precision: 6, withTimezone: true,  }).defaultNow().notNull(),
	type: linkType("type").notNull(),
	label: text("label").notNull(),
	url: text("url").notNull(),
	googleDriveId: text("googleDriveId").references(() => googleDriveFile.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => {
	return {
		googleDriveIdKey: uniqueIndex("SongFileLink_googleDriveId_key").on(table.googleDriveId),
		songFileLinkPkey: primaryKey(table.songId, table.label)
	}
});