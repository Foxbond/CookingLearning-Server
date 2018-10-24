SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE `groups` (
  `groupId` int(11) NOT NULL,
  `groupName` varchar(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `mailQueue` (
  `mailId` int(11) NOT NULL,
  `mailTimestamp` bigint(20) NOT NULL,
  `mailPriority` tinyint(4) NOT NULL,
  `mailStatus` tinyint(4) NOT NULL,
  `mailRetries` int(11) NOT NULL,
  `mailFrom` varchar(255) NOT NULL,
  `mailTo` varchar(255) NOT NULL,
  `mailSubject` varchar(255) NOT NULL,
  `mailContent` text NOT NULL,
  `mailContentHtml` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `recipes` (
  `recipeId` int(11) NOT NULL,
  `recipeName` varchar(20) NOT NULL,
  `recipeUrl` varchar(20) NOT NULL,
  `recipeDesc` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `recipesteps` (
  `recipeId` int(11) NOT NULL,
  `recipestepOrder` int(11) NOT NULL,
  `recipestepText` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `usergroups` (
  `userId` int(11) NOT NULL,
  `groupId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `users` (
  `userId` int(11) NOT NULL,
  `userMail` varchar(255) NOT NULL,
  `userName` varchar(20) NOT NULL,
  `userPassword` char(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `usertokens` (
  `userId` int(11) NOT NULL,
  `tokenCreated` bigint(20) NOT NULL,
  `tokenValue` char(16) NOT NULL,
  `tokenType` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE `groups`
  ADD PRIMARY KEY (`groupId`);

ALTER TABLE `mailQueue`
  ADD PRIMARY KEY (`mailId`);

ALTER TABLE `recipes`
  ADD PRIMARY KEY (`recipeId`);

ALTER TABLE `recipesteps`
  ADD KEY `recipeId` (`recipeId`);

ALTER TABLE `usergroups`
  ADD UNIQUE KEY `userId_groupId` (`userId`,`groupId`) USING BTREE,
  ADD KEY `userId` (`userId`),
  ADD KEY `groupId` (`groupId`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `userMail` (`userMail`),
  ADD KEY `userName` (`userName`);

ALTER TABLE `usertokens`
  ADD UNIQUE KEY `token` (`tokenValue`),
  ADD KEY `userId` (`userId`);


ALTER TABLE `groups`
  MODIFY `groupId` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `mailQueue`
  MODIFY `mailId` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `recipes`
  MODIFY `recipeId` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `users`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `usergroups`
  ADD CONSTRAINT `usergroups.groupId` FOREIGN KEY (`groupId`) REFERENCES `groups` (`groupId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `usergroups.userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `usertokens`
  ADD CONSTRAINT `activationsessions.userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
