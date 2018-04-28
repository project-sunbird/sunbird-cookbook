// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//

Cypress.Commands.add('kcLogin', (username, password) => {
  const kcRoot = 'https://www.jaldhara.in';
  const kcRealm = 'sunbird';
  const kcClient = 'portal';
  const kcRedirectUri = `${kcRoot}/private/index?auth_callback`;
  const loginPageRequest = {
    url: `${kcRoot}/auth/realms/${kcRealm}/protocol/openid-connect/auth`,
    qs: {
      client_id: kcClient,
      redirect_uri: kcRedirectUri,
      state: createUUID(),
      nonce: createUUID(),
      response_mode: 'fragment',
      response_type: 'code',
      scope: 'openid'
    }
  };
  const indexPageRequest = {
    url: `${kcRoot}/private/index/`
  };

  // Open the KC login page, fill in the form with username and password and submit.
  return cy.request(indexPageRequest)
    .then(submitLoginForm);
  ////////////

  function submitLoginForm(response) {
    const _el = document.createElement('html');
    _el.innerHTML = response.body;
    // This should be more strict depending on your login page template.
    const loginForm = _el.getElementsByTagName('form');
    const isAlreadyLoggedIn = !loginForm.length;
    if (isAlreadyLoggedIn) {
      return;
    }

    return cy.request({
      form: true,
      method: 'POST',
      url: loginForm[0].action,
      followRedirect: false,
      body: {
        username: username,
        password: password
      }
    });
  }

  // Copy-pasted code from KC javascript client. It probably doesn't need to be
  // this complicated but I refused to spend time on figuring that out.
  function createUUID() {
    var s = [];
    var hexDigits = '0123456789abcdef';
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4';
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = '-';
    var uuid = s.join('');
    return uuid;
  }
});

Cypress.Commands.add('kcLogout', () => {
  const kcRoot = 'https://www.jaldhara.in';
  const kcRealm = 'sunbird';
  const kcRedirectUri = `${kcRoot}/`;
  return cy.request({
    url: `${kcRoot}/auth/realms/${kcRealm}/protocol/openid-connect/logout`,
    qs: {
      redirect_uri: kcRedirectUri
    }
  });
});

//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
