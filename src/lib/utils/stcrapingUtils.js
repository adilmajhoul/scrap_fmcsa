//TODO: move all shared functions here

async function paginationLoop(startingPageUrl) {
  let url = startingPageUrl;

  let allLinks = [];
  while (true) {
    const { html, nextPageUrl } = await getPage(url, 'div > a.next');

    let newLinks = await parseLinks(html, 'div > div.post-image > a');

    allLinks = [...allLinks, ...newLinks];

    if (!nextPageUrl) {
      break;
    } else {
      url = nextPageUrl;
    }
  }

  return allLinks;
}
