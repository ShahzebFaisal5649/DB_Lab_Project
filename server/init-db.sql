-- EDU-Connect Database Schema
-- Auto-generated from Prisma schema for local development

CREATE DATABASE IF NOT EXISTS edu_connect_db;
USE edu_connect_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Student` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `learningGoals` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Student_userId_key` (`userId`),
  CONSTRAINT `Student_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Tutor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `location` VARCHAR(191) NULL,
  `availability` JSON NULL,
  `isVerified` TINYINT(1) NOT NULL DEFAULT 0,
  `careerStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `verificationDocument` LONGBLOB NULL,
  `mcqTestScore` INT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tutor_userId_key` (`userId`),
  CONSTRAINT `Tutor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Admin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Admin_userId_key` (`userId`),
  CONSTRAINT `Admin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Subject` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Subject_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `_StudentPreferredSubjects` (
  `A` INT NOT NULL,
  `B` INT NOT NULL,
  PRIMARY KEY (`A`, `B`),
  CONSTRAINT `_StudentPreferredSubjects_A_fkey` FOREIGN KEY (`A`) REFERENCES `Student` (`id`) ON DELETE CASCADE,
  CONSTRAINT `_StudentPreferredSubjects_B_fkey` FOREIGN KEY (`B`) REFERENCES `Subject` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `_TutorSubjects` (
  `A` INT NOT NULL,
  `B` INT NOT NULL,
  PRIMARY KEY (`A`, `B`),
  CONSTRAINT `_TutorSubjects_A_fkey` FOREIGN KEY (`A`) REFERENCES `Subject` (`id`) ON DELETE CASCADE,
  CONSTRAINT `_TutorSubjects_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tutor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SessionRequest` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `studentId` INT NOT NULL,
  `tutorId` INT NOT NULL,
  `subjectId` INT NOT NULL,
  `content` VARCHAR(191) NOT NULL DEFAULT '',
  `requestedTime` DATETIME(3) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `sessionId` INT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SessionRequest_sessionId_key` (`sessionId`),
  CONSTRAINT `SessionRequest_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`),
  CONSTRAINT `SessionRequest_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `Tutor` (`id`),
  CONSTRAINT `SessionRequest_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Session` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tutorId` INT NOT NULL,
  `sessionRequestId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Session_sessionRequestId_key` (`sessionRequestId`),
  CONSTRAINT `Session_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `Tutor` (`id`),
  CONSTRAINT `Session_sessionRequestId_fkey` FOREIGN KEY (`sessionRequestId`) REFERENCES `SessionRequest` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `_SessionStudents` (
  `A` INT NOT NULL,
  `B` INT NOT NULL,
  PRIMARY KEY (`A`, `B`),
  CONSTRAINT `_SessionStudents_A_fkey` FOREIGN KEY (`A`) REFERENCES `Session` (`id`) ON DELETE CASCADE,
  CONSTRAINT `_SessionStudents_B_fkey` FOREIGN KEY (`B`) REFERENCES `Student` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Feedback` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sessionRequestId` INT NOT NULL,
  `fromId` INT NOT NULL,
  `toId` INT NOT NULL,
  `rating` INT NOT NULL,
  `comments` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Feedback_sessionRequestId_key` (`sessionRequestId`),
  CONSTRAINT `Feedback_sessionRequestId_fkey` FOREIGN KEY (`sessionRequestId`) REFERENCES `SessionRequest` (`id`),
  CONSTRAINT `Feedback_fromId_fkey` FOREIGN KEY (`fromId`) REFERENCES `User` (`id`),
  CONSTRAINT `Feedback_toId_fkey` FOREIGN KEY (`toId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Message` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sessionId` INT NOT NULL,
  `senderId` INT NOT NULL,
  `content` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `Message_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session` (`id`),
  CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
