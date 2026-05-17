-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'authorized', 'active', 'paused', 'cancelled', 'failed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'REFUNDED');

-- AlterTable Subscription: add new nullable columns first
ALTER TABLE "Subscription" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "pausedAt" TIMESTAMP(3);

-- AlterTable Subscription: add updatedAt with default for existing rows, then keep it
ALTER TABLE "Subscription" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable Subscription: convert status string to enum using cast
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus" USING "status"::"SubscriptionStatus";
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'pending'::"SubscriptionStatus";

-- CreateIndex for status
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateTable Payment
CREATE TABLE "Payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL,
    "mpPaymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "status" "PaymentStatus" NOT NULL,
    "paidAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable WebhookEvent
CREATE TABLE "WebhookEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "topic" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for Payment
CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON "Payment"("mpPaymentId");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex for WebhookEvent
CREATE INDEX "WebhookEvent_topic_externalId_idx" ON "WebhookEvent"("topic", "externalId");
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
