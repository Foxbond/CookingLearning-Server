CREATE TABLE `users` (
  `userId` int(11) NOT NULL,
  `userMail` varchar(64) NOT NULL,
  `userName` varchar(20) NOT NULL,
  `userPassword` char(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `userMail` (`userMail`),
  ADD KEY `userName` (`userName`);


ALTER TABLE `users`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT;