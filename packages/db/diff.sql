
-- CreateTable
CREATE TABLE "content_topics" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_analyses" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "latency" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_businessId_userId_idx" ON "conversations"("businessId", "userId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "knowledge_entries_businessId_idx" ON "knowledge_entries"("businessId");

-- CreateIndex
CREATE INDEX "knowledge_entries_sourceId_idx" ON "knowledge_entries"("sourceId");

-- CreateIndex
CREATE INDEX "knowledge_entries_contentHash_idx" ON "knowledge_entries"("contentHash");

-- CreateIndex
CREATE INDEX "knowledge_entries_businessId_classification_idx" ON "knowledge_entries"("businessId", "classification");

-- CreateIndex
CREATE INDEX "knowledge_entries_businessId_isStale_confidence_idx" ON "knowledge_entries"("businessId", "isStale", "confidence");

-- CreateIndex
CREATE INDEX "knowledge_ingestion_logs_sourceId_idx" ON "knowledge_ingestion_logs"("sourceId");

-- CreateIndex
CREATE INDEX "knowledge_jobs_businessId_idx" ON "knowledge_jobs"("businessId");

-- CreateIndex
CREATE INDEX "knowledge_jobs_sourceId_idx" ON "knowledge_jobs"("sourceId");

-- CreateIndex
CREATE INDEX "knowledge_sources_businessId_idx" ON "knowledge_sources"("businessId");

-- CreateIndex
CREATE INDEX "knowledge_sources_brandId_idx" ON "knowledge_sources"("brandId");

-- CreateIndex
CREATE INDEX "knowledge_sources_businessId_status_idx" ON "knowledge_sources"("businessId", "status");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "content_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_topics" ADD CONSTRAINT "content_topics_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_analyses" ADD CONSTRAINT "brand_analyses_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "contents_generation_group_id_idx" RENAME TO "contents_generationGroupId_idx";

