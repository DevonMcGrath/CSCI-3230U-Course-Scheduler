@ECHO off
TITLE UOIT Course Scheduler
REM Name: start-server.bat
REM Author: Devon McGrath
REM Description: This batch script starts the server, database, and downloads
REM any node packages needed.

REM install node modules if necessary
if not exist node_modules/ (
	npm install
)

REM TODO: start the database

REM Start the node server
node server.js