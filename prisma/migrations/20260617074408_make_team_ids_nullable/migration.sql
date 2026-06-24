-- DropForeignKey
ALTER TABLE `Match` DROP FOREIGN KEY `Match_teamAId_fkey`;

-- DropForeignKey
ALTER TABLE `Match` DROP FOREIGN KEY `Match_teamBId_fkey`;

-- AlterTable
ALTER TABLE `Match` MODIFY `teamAId` INTEGER NULL,
    MODIFY `teamBId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_teamAId_fkey` FOREIGN KEY (`teamAId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_teamBId_fkey` FOREIGN KEY (`teamBId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
