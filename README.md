# CSCI 3230U - Final Project - UOIT Course Scheduler
## Contributors
- [Devon McGrath](https://github.com/DevonMcGrath)
- [Martin Tuzim](https://github.com/Nomulous)

## Description
One of the challenges students (especially first-years) face is creating a good schedule. It can be very time consuming to create a good schedule. This web application allows users to create schedules for a given semester and interactively select sections to include. The resulting schedule can be exported to an image (of the schedule) or a CSV file of section CRNs.

## Running the Project Locally
### Requirements:
- Node.js (download [here](https://nodejs.org))
  - Ensure `node` and `npm` are added to your PATH
- MongoDB (download [here](https://www.mongodb.com/))
  - Ensure `mongod` is added to your PATH

### Steps to run:
#### Windows
1. Run `src/start-server.bat`

#### Manual
1. In command prompt/terminal, navigate to `src/`
1. Make a directory called `data`
1. Download dependencies with `npm install`
1. Start MongoDB with `mongod --dbpath .\data`
1. Start the Node server with `node server.js`
1. In your browser, navigate to http://localhost:8080/

## TODO
- [ ] Front-end: create pages, style, front-end JS
- [x] Node.js: Create back-end server
- [ ] Node.js: Create web scraper for getting course listings
- [ ] Node.js: Track sessions
- [ ] Database: containing sections that are relevant to the user
- [ ] AJAX: to get terms and subjects in a given term
- [ ] Home page
- [ ] Select Courses page
- [ ] Schedule Options page
- [ ] Schedule Creator page
- [x] Program Browser page
- [ ] Other requirements...

## Pages TODO
### Course Selection Page (initial):
The initial page is used to select the term and courses to take. It will be used as follows:
1. Server: web-scraps [this page](https://ssbp.mycampus.ca/prod_uoit/bwckschd.p_disp_dyn_sched?TRM=U) and gets the available terms
1. Server: generates the appropriate HTML
1. User: selects term (e.g. UOIT Winter 2018)
1. Page: sends request to Node server with the selected term
1. Server: web-scraps https://ssbp.mycampus.ca/prod_uoit/bwckgens.p_proc_term_date and gets the available subjects
1. Server: responds with the list of subjects available for that term
1. User: selects a subject
1. User: enters a code, part of a code, or nothing
1. Page: sends request to Node server with the subject and user-entered code
1. Server: sends request and gets the available sections (via web-scraping)
1. Server: sends an HTTP response with only the course names (e.g. CSCI 3230U - Web Application Development)
1. User: selects course(s) they want in their schedule // repeat 7 - 12 until all courses are added
1. User: goes to the next page

### Schedule Options Page:
The schedule options page is used to determine how the user wants to generate the schedule. This includes a manual creation option and more advanced; a number of options asking the user what they would like their schedule to look like (e.g. little breaks between class, Fridays off, etc.). Possible scheduling options could include:
- Days off (checkbox): Mon/Tue/Wed/Thu/Fri
- Breaks (MC): as small as possible/1-2 hours/2-3 hours
- more...

### Schedule Creator Page
This page is responsible for allowing the user to create, modify, and download their schedule. Supported download types should be: images (of schedule), CSV (of CRNs), and possibly PDF. On wider screens (e.g. tablets, desktops) the schedule view should be the entire week. On smaller screens such as mobile devices, only show one day at a time.
The user should be able to interactively modify their schedule to include or remove sections of the courses selected from the previous page. While doing this, the schedule view should change to show outlines of sections the user wants to add to see how the schedule would change.
