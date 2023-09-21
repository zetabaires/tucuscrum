// const key = "002ca967329c859e62cdb71049066ee2";
// const token = "ZmUxNjNhMjQ4ZTBhZjA3ZWM0MDcxNWUwMWY0YzNkOWMwNWE5NmRkNjhiYzUwOWQwMzNmNmFmYjUzM2ZiMGE1NQ==";
// const key = "14ce07b3203f16ca21f9de6965e3b577";
// const token = "YzQ4OTczZTZkMGM1ZWU1ZTI2ODgxNzBiNTkyOWEzNzIxY2VmMTE5YmJhZDk3MzVmODUwMDcwYjczMDZhZTQ3Ng==";
const key = "14ce07b3203f16ca21f9de6965e3b577";
const token = "QVRUQTQxM2MwM2Y2OTQ4NjQwYzNiZjMzNzVmMWJhODc2NTk5MWM5ZWNjMjI5NjZmZDEwZjRiNjVkOWNmMjVhOWMxNjcwNzkzREQ5OA==";
// ATTA413c03f6948640c3bf3375f1ba8765991c9ecc22966fd10f4b65d9cf25a9c1670793DD98

const fix = str => str.indexOf('?') !== -1 ? '&' : '?';

const getUrl = url => `https://api.trello.com/1/${url + fix(url)}key=${key}&token=${atob(token)}`;

//const trelloId = "5ba132d5e4b91d12ada08efc";
const trelloListId = '650ca678ab1007084203dc12';
const activeUsersListId = '650ca67802c643dd67a3b650';

const projectId = '650ca6f09d43332d3d1a2ab6';
const adminUsersId = '650caf14137eea77ff3a8b99';
const scoreId = '650caf16136a3b5a425f0910';

const boardId = '650ca6788642e0a2f7d51d52';

const licenciasCardId = '650cae6d3b10dfff5a78f249';
const ignoreStaticCardsList = [licenciasCardId];

const enableTimer = true;

const timerDelay = 4;
const avarageQuantityPercentaje = 40;

const lockMessage = 'try to call lock resource';