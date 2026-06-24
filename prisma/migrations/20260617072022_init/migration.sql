-- CreateTable
CREATE TABLE `Team` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `group` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Team_code_key`(`code`),
    INDEX `Team_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teamAId` INTEGER NOT NULL,
    `teamBId` INTEGER NOT NULL,
    `scoreA` INTEGER NULL,
    `scoreB` INTEGER NULL,
    `phase` VARCHAR(20) NOT NULL DEFAULT 'group',
    `status` VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    `round` INTEGER NULL,
    `bracketPos` VARCHAR(10) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Match_phase_idx`(`phase`),
    INDEX `Match_status_idx`(`status`),
    INDEX `Match_phase_status_idx`(`phase`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_teamAId_fkey` FOREIGN KEY (`teamAId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_teamBId_fkey` FOREIGN KEY (`teamBId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
