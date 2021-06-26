# Pure Fitness class booking'
## What it does?
- Auto fitness/yoga class booking two days in advance
- Auto submit the annoying declaration form

## How it works?
- Step 1: Login to the web app with the same login credential as if you are logging in to the Pure Fitness portal
- Step 2: Select the class that you wanted to book
- Step 3: Get enough protein and work hard in the classes 


## Screenshots
![Screenshot](https://i.postimg.cc/Qd32KbW1/screencapture-pure-automator-316705-web-app-2021-06-27-02-11-54-1.png)

## Stacks
### Backend
Typescript with serverless architecture powered by Google Cloud(Firestore, Hosting, Cloud function, Cloud Scheduler, Pub/Sub)
### Frontend
React + Typescript
### Deployment
Github Action

## Test Pilot
If you are lucky enought to see this repo and you are also a pure fitness member. Here you go: https://pure-automator-316705.web.app/

- In order to book the class on behalf of youself I have to store your Pure Fitness credential in the database. **At the moment it is stored in plaintext**
- It was designed to be used for myself only. I don't guarantee it works for you