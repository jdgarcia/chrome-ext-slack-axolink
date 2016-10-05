console.info('Running AxoLink...');

const ID_REGEX = new RegExp(/(\bASI\d{6}|\b\d{5}|\B#\d+)\b/gi);
const URL_REGEX = new RegExp(/https:\/\/axosoft.axosoft.com\/viewitem\?id=(\w+)\S*/);
const MESSAGE_BODY_SELECTOR = '.message_body';

function setup() {
  console.info('Setting up observer...')
  const msgsDiv = document.getElementById('msgs_div');

  if (!msgsDiv) {
    console.info('Target element not found, trying again later.');
    setTimeout(setupObserver, 100);
    return;
  }

  const msgs = msgsDiv.querySelectorAll(MESSAGE_BODY_SELECTOR);
  traverseNodes(msgs);

  console.info('Initial traverse done!');

  const observer = new MutationObserver(onMutation);
  const config = {
    childList: true,
    subtree: true
  };

  observer.observe(msgsDiv, config);

  console.info('Observer set!');
}

function onMutation(mutations) {
  const msgs = [];

  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(addedNode => {
      if ((addedNode.className && addedNode.className === 'day_container') || addedNode.nodeName === 'TS-MESSAGE') {
        msgs.push(...addedNode.querySelectorAll(MESSAGE_BODY_SELECTOR));
      }
    });
  });

  traverseNodes(msgs);
}

function traverseNodes(nodes) {
  nodes.forEach(node => {
    if (node.nodeName === 'A') {
      const axoUrl = node.textContent.match(URL_REGEX);
      if (axoUrl) {
        const id = axoUrl[1].toUpperCase();
        node.textContent = (id.startsWith('ASI') ? '' : '#') + id;
      }
      return;
    }

    if (node.nodeName === '#text') {
      return parseContent(node);
    }

    return traverseNodes(node.childNodes);
  });
}

function parseContent(node) {
  const matches = [];
  let match;

  while (match = ID_REGEX.exec(node.textContent)) {
    matches.push(match);
  }

  if (matches.length) {
    linkify(node, matches);
  }
}

function linkify(node, matches) {
  let remainingText = node.textContent;
  const nodesToAdd = [];

  for (let i = matches.length; i > 0; i--) {
    const match = matches[i - 1];
    const id = match[0].toUpperCase();

    const postText = remainingText.substring(match.index + id.length);
    remainingText = remainingText.substring(0, match.index);

    const link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.textContent = ((id.startsWith('#') || id.startsWith('ASI')) ? '' : '#') + id;
    link.href = getItemUrl(id);

    nodesToAdd.push(document.createTextNode(postText));
    nodesToAdd.push(link);
  }

  if (remainingText) {
    nodesToAdd.push(document.createTextNode(remainingText));
  }

  const parent = node.parentNode;
  while (nodesToAdd.length) {
    parent.insertBefore(nodesToAdd.pop(), node);
  }

  node.remove();
}

function getItemUrl(id) {
  const type = id.startsWith('ASI') ? 'incidents' : 'features';
  return `https://axosoft.axosoft.com/viewitem?id=${id}&type=${type}&force_use_number=true`;
}

setup();
