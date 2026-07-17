-- CreateTable
CREATE TABLE "Marca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "site" TEXT,
    "instagram" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'Outra',
    "porte" TEXT,
    "origem" TEXT,
    "notas" TEXT,
    "fazPubli" BOOLEAN NOT NULL DEFAULT false,
    "rodaAnuncios" BOOLEAN NOT NULL DEFAULT false,
    "temEcommerce" BOOLEAN NOT NULL DEFAULT false,
    "jaInteragiu" BOOLEAN NOT NULL DEFAULT false,
    "naoContatar" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PESQUISADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marcaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "fonteEmail" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "linkedin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contato_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Campanha" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "pitchBase" TEXT,
    "periodo" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Template" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "etapa" TEXT NOT NULL DEFAULT 'INICIAL',
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Interacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marcaId" INTEGER NOT NULL,
    "contatoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "assunto" TEXT,
    "corpo" TEXT,
    "resultado" TEXT,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interacao_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Interacao_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "Contato" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Config" (
    "chave" TEXT NOT NULL PRIMARY KEY,
    "valor" TEXT NOT NULL
);
