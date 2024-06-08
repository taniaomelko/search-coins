const url = "https://api-eu.okotoki.com/coins";

export const getData = () => {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      return data;
    })
    .catch(error => {
      console.log(`Fetch error: ${error}`);
    });
}
