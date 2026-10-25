CREATE TYPE "ActivityType" AS ENUM ('MAIN', 'REINFORCEMENT');
CREATE TYPE "LearningState" AS ENUM ('MAIN', 'THEORY', 'REINFORCEMENT', 'COMPLETED');

CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TheoryContent" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TheoryContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityOption" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ActivityOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "state" "LearningState" NOT NULL,
    "currentTopicId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attempt" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicCompletion" (
    "topicId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopicCompletion_pkey" PRIMARY KEY ("topicId")
);

CREATE UNIQUE INDEX "Topic_code_key" ON "Topic"("code");
CREATE UNIQUE INDEX "Topic_order_key" ON "Topic"("order");
CREATE UNIQUE INDEX "TheoryContent_topicId_key" ON "TheoryContent"("topicId");
CREATE UNIQUE INDEX "Activity_code_key" ON "Activity"("code");
CREATE UNIQUE INDEX "Activity_topicId_type_key" ON "Activity"("topicId", "type");
CREATE UNIQUE INDEX "ActivityOption_activityId_key_key" ON "ActivityOption"("activityId", "key");
CREATE INDEX "Attempt_createdAt_idx" ON "Attempt"("createdAt");

ALTER TABLE "TheoryContent" ADD CONSTRAINT "TheoryContent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityOption" ADD CONSTRAINT "ActivityOption_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_currentTopicId_fkey" FOREIGN KEY ("currentTopicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TopicCompletion" ADD CONSTRAINT "TopicCompletion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
