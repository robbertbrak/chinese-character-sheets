// Taken from http://stackoverflow.com/a/979995/815176
export default function() {
  let queryString = {};
  let query = window.location.search.substring(1);
  let vars = query.split('&');
  vars.forEach((part) => {
    let pair = part.split('=');
    if (typeof queryString[pair[0]] === 'undefined') {
      queryString[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof queryString[pair[0]] === 'string') {
      let arr = [ queryString[pair[0]],decodeURIComponent(pair[1]) ];
      queryString[pair[0]] = arr;
    } else {
      queryString[pair[0]].push(decodeURIComponent(pair[1]));
    }
  });
  return queryString;
};
