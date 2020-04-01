const key = "002ca967329c859e62cdb71049066ee2";
const token = "ZmUxNjNhMjQ4ZTBhZjA3ZWM0MDcxNWUwMWY0YzNkOWMwNWE5NmRkNjhiYzUwOWQwMzNmNmFmYjUzM2ZiMGE1NQ==";

const fix = str => str.indexOf('?') !== -1 ? '&' : '?';

const getUrl = url => `https://api.trello.com/1/${url + fix(url)}key=${key}&token=${atob(token)}`;

//const trelloId = "5ba132d5e4b91d12ada08efc";
const trelloListId = '5e822b3b92ce775397b9cdf8';
const activeUsersListId = '5e8235cda2e4ec40d931979c';

const projectId = '5e8408130171f230fcddcb10';
const adminUsersId = '5e822b41141a2507d5c962ca';
const scoreId = '5e822b4bd8dc2c669b88c9b0';

const boardId = '5dd54a2725bf3b8e854e64bb';

const enableTimer = true;