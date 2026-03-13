-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'template', 'interactive', 'button_reply', 'list_reply');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "type" "MessageType" NOT NULL DEFAULT 'text',
ADD COLUMN "metadata" JSONB;
