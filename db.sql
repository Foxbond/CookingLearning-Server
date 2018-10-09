CREATE TABLE `groups` (
  `groupId` int(11) NOT NULL,
  `groupName` varchar(16) NOT NULL
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


ALTER TABLE `groups`
  ADD PRIMARY KEY (`groupId`);

ALTER TABLE `usergroups`
  ADD KEY `userId` (`userId`),
  ADD KEY `groupId` (`groupId`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `userMail` (`userMail`),
  ADD KEY `userName` (`userName`);


ALTER TABLE `groups`
  MODIFY `groupId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
ALTER TABLE `users`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

ALTER TABLE `usergroups`
  ADD CONSTRAINT `groupId` FOREIGN KEY (`groupId`) REFERENCES `groups` (`groupId`) ON DELETE CASCADE,
  ADD CONSTRAINT `userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;
