# Pure Fitness class booking
## What it does?
- Auto book fitness/yoga class two days in advance
- Auto submit the annoying declaration form for you

![Screenshot](https://i.postimg.cc/Qd32KbW1/screencapture-pure-automator-316705-web-app-2021-06-27-02-11-54-1.png)

## local dev
To download cloud env to local
`firebase functions:config:get > .runtimeconfig.json`

## Test Pilot [under development]
If you are lucky enought to see this repo and you are also a pure fitness member. Here you go: https://pure-automator-316705.web.app/

It was developed for learning purpose only. I don't guarantee it works everytime :)

- Step 1*: No registration is needed. Just login to the web app with the same login credential as if you are logging in to the Pure Fitness portal
- Step 2: Select the class that you wanted to book
- Step 3: Get enough protein and work hard in the classes

\* In order to book the class on behalf of youself I will have to store your Pure Fitness credential in the database. **At the moment it is stored in plaintext**

## Development journey [TODO]
This project is my first attempt to discover how google cloud works.
1. Firebase functions: Dealing with performance(Avoid cold boot!)
1. Cloud Schedular: Fire on time(Build your own scheduler)
1. Monorepo

## Tech Stacks
### Backend
Typescript with serverless architecture powered by Google Cloud(Firestore, Hosting, Cloud function, Cloud Scheduler, Pub/Sub)
### Frontend
React + Typescript
### Deployment
Github Action
