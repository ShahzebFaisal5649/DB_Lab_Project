-- MySQL dump 10.13  Distrib 8.0.39, for Linux (x86_64)
--
-- Host: localhost    Database: edu_connect_db
-- ------------------------------------------------------
-- Server version	8.0.39-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Feedback`
--

DROP TABLE IF EXISTS `Feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionRequestId` int NOT NULL,
  `fromId` int NOT NULL,
  `toId` int NOT NULL,
  `rating` int NOT NULL,
  `comments` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Feedback_sessionRequestId_key` (`sessionRequestId`),
  KEY `Feedback_fromId_fkey` (`fromId`),
  KEY `Feedback_toId_fkey` (`toId`),
  CONSTRAINT `Feedback_fromId_fkey` FOREIGN KEY (`fromId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Feedback_sessionRequestId_fkey` FOREIGN KEY (`sessionRequestId`) REFERENCES `SessionRequest` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Feedback_toId_fkey` FOREIGN KEY (`toId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Feedback`
--

LOCK TABLES `Feedback` WRITE;
/*!40000 ALTER TABLE `Feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `Feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Message`
--

DROP TABLE IF EXISTS `Message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` int NOT NULL,
  `senderId` int NOT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Message_sessionId_fkey` (`sessionId`),
  KEY `Message_senderId_fkey` (`senderId`),
  CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Message_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Message`
--

LOCK TABLES `Message` WRITE;
/*!40000 ALTER TABLE `Message` DISABLE KEYS */;
/*!40000 ALTER TABLE `Message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PreferredSubject`
--

DROP TABLE IF EXISTS `PreferredSubject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PreferredSubject` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PreferredSubject_userId_fkey` (`userId`),
  CONSTRAINT `PreferredSubject_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PreferredSubject`
--

LOCK TABLES `PreferredSubject` WRITE;
/*!40000 ALTER TABLE `PreferredSubject` DISABLE KEYS */;
INSERT INTO `PreferredSubject` VALUES (1,'Math',4);
/*!40000 ALTER TABLE `PreferredSubject` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Session`
--

DROP TABLE IF EXISTS `Session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Session` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tutorId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Session_tutorId_fkey` (`tutorId`),
  CONSTRAINT `Session_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Session`
--

LOCK TABLES `Session` WRITE;
/*!40000 ALTER TABLE `Session` DISABLE KEYS */;
INSERT INTO `Session` VALUES (23,2,'2024-10-21 10:36:33.585');
/*!40000 ALTER TABLE `Session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SessionRequest`
--

DROP TABLE IF EXISTS `SessionRequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SessionRequest` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `tutorId` int NOT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestedTime` datetime(3) NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `SessionRequest_studentId_fkey` (`studentId`),
  KEY `SessionRequest_tutorId_fkey` (`tutorId`),
  CONSTRAINT `SessionRequest_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SessionRequest_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SessionRequest`
--

LOCK TABLES `SessionRequest` WRITE;
/*!40000 ALTER TABLE `SessionRequest` DISABLE KEYS */;
INSERT INTO `SessionRequest` VALUES (1,1,2,'English','2024-10-15 22:19:00.000','accepted'),(2,1,2,'Math','2024-10-19 15:29:00.000','declined'),(3,1,5,'Urdu','2024-10-19 15:31:00.000','pending'),(4,1,2,'Math','2024-10-19 18:44:00.000','declined'),(5,1,2,'adbc','2024-10-20 22:12:00.000','declined');
/*!40000 ALTER TABLE `SessionRequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Subject`
--

DROP TABLE IF EXISTS `Subject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Subject` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Subject_userId_fkey` (`userId`),
  CONSTRAINT `Subject_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Subject`
--

LOCK TABLES `Subject` WRITE;
/*!40000 ALTER TABLE `Subject` DISABLE KEYS */;
INSERT INTO `Subject` VALUES (1,'Math',3),(2,'English',3),(4,'Urdu',3),(6,'Sociology',3),(7,'English',5);
/*!40000 ALTER TABLE `Subject` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `availability` json DEFAULT NULL,
  `learningGoals` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `careerStatus` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isVerified` tinyint(1) NOT NULL DEFAULT '0',
  `mcqTestScore` int DEFAULT NULL,
  `verificationDocument` longblob,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'Student1','student1@gmail.com','$2b$10$nZK7zSVPpdSP9pILEWkLRum4JWydfIrBKijuJRElyha1uPxD2cUnu','student','null','ABC',NULL,NULL,0,NULL,NULL);
INSERT INTO `User` VALUES (3,'Admin1','admin1@gmail.com','$2b$10$HNxikNquvZnIFjFLOlxToO9fQZYs52jPTaQFi9CH0K43himz6uW06','admin','null',NULL,NULL,NULL,0,NULL,NULL),(4,'Student2','student2@gmail.com','$2b$10$xFFEuLivfQTBIoXU8OlY3uLzOkDptGC5oyooL.C34y2gUUiwDIrg6','student','null','None',NULL,NULL,0,NULL,NULL),(5,'Tutor2','Tutor2@gmail.com','$2b$10$NMmWi/MMXkXv2Y8jY.94/eSV.U0XycJLN4IkfDuGFdBhxsolBBPW2','tutor','[{\"day\": \"Wednesday\", \"time\": \"11:00\"}, {\"day\": \"Saturday\", \"time\": \"07:00\"}]',NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_SessionStudents`
--

DROP TABLE IF EXISTS `_SessionStudents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_SessionStudents` (
  `A` int NOT NULL,
  `B` int NOT NULL,
  UNIQUE KEY `_SessionStudents_AB_unique` (`A`,`B`),
  KEY `_SessionStudents_B_index` (`B`),
  CONSTRAINT `_SessionStudents_A_fkey` FOREIGN KEY (`A`) REFERENCES `Session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_SessionStudents_B_fkey` FOREIGN KEY (`B`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_SessionStudents`
--

LOCK TABLES `_SessionStudents` WRITE;
/*!40000 ALTER TABLE `_SessionStudents` DISABLE KEYS */;
INSERT INTO `_SessionStudents` VALUES (23,1);
/*!40000 ALTER TABLE `_SessionStudents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('3a21c01e-61dd-47b2-a067-e78fdba30c99','65be17b6245d9a0e3d8668d838ba320c906d452c9e4993715e3a4f2f057895fc','2024-10-18 06:55:04.209','20241018065504_add_verification_document',NULL,NULL,'2024-10-18 06:55:04.097',1),('540f6b5e-d297-46b8-89a2-dd6aea36e300','896a4d06f3319adb199b583870ecb4bac4df41593f74c6e2086074877da75d11','2024-10-12 15:54:36.834','20241012155436_add_session_and_message_models',NULL,NULL,'2024-10-12 15:54:36.254',1),('6955c9ef-8334-4bd7-9393-003acfbb8270','895cacfad0e1e299504d6f670730d003d76fb86c080a09200e3f4f79f1f57fcd','2024-10-12 08:01:22.289','20241012080121_add_subjects_preferred_subjects',NULL,NULL,'2024-10-12 08:01:21.938',1),('a2f795dd-5c32-45f7-a735-a9e8b86ad9ea','b9371b8b924625ded3560d60d2602f43fd37529eaa5484efeb1eee608c1a4470','2024-10-12 10:02:03.724','20241012100203_add_session_and_feedback',NULL,NULL,'2024-10-12 10:02:03.106',1),('cca94dc5-ac0e-4b11-8609-940d1e08ef96','4504b4d4fe472acdab18fe648e66dd548cafe4c8ca0233e32baead3c064842d3','2024-10-15 02:09:25.915','20241015020925_update_subject_model',NULL,NULL,'2024-10-15 02:09:25.598',1),('d0782232-4e95-4b08-ab2a-b4b387eac23d','b6fc02f84668f1208f300de437d5716c7ad95a0a8cf502f10bcd60b1cf7a8773','2024-10-12 07:14:46.366','20241012071446_init',NULL,NULL,'2024-10-12 07:14:46.228',1),('ff16af02-aef6-4013-89e0-b9946dd20db4','0db8589768e098eea475dca064f7f8621a63a6fe841fb2caab1e4553ed999ee7','2024-10-15 02:19:50.673','20241015021950_update_subject_model',NULL,NULL,'2024-10-15 02:19:50.487',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-10-21 19:32:15