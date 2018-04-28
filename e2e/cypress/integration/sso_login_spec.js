const getProfileMenu = () => cy.get('#dropdown-menu-list-header div.menu');
const getNameFromMenu = ($menu) => $menu.find('div:first-child');

describe('Navigation test', () => {
  it('should render the home page', () => {
    cy.visit('https://www.jaldhara.in/');
  })
});

describe('Login to home page test', () => {
  beforeEach(() =>  {
    cy.kcLogin('creator1', 'wobbly_woo');
  });

  afterEach(() =>  {
    cy.kcLogout();
  });

  it('should render logged user name somewhere on the page', () =>  {
    cy.visit('https://www.jaldhara.in/private/index#!/home');
    var menu = getProfileMenu();
    getNameFromMenu(menu).should('have.text', 'Creator One');
  });
});
