#!/bin/bash
git archive -o bible-robot-master.zip HEAD
scp bible-robot-master.zip root@$server_ip:/root/workspace
rm bible-robot-master.zip