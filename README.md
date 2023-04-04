# Daily report generator from Clockify and Todoist

1. Create `.env` file and fill with real tokens and id's (example is in `.sample.env`)

2. Run:
```console
foo@bar:~$ yarn start
yarn run v1.22.17
Report is copied to your clipboard successfully!
$ node index.js
✨  Done in 3.32s.
```

3. Paste the report to your markdown editor:
```
**Что делал:**
- Meeting with the team
- Discuss api with the backend team
- `[T-904]: Fix login form` - 
- `[T-396]: Fix error sign up page` -

**Что планирую:**
- `[T-1134]: Fix button layout` - 
- `[T-334]: New feature on the main page` -
...
```