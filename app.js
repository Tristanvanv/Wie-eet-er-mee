gsap.registerPlugin(ScrollSmoother);

window.addEventListener("load", () => {
  //scrollsmoother
  const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.2,
    effects: true,
  });

  //mobile menu
  const menu = document.querySelector("#mobile-menu");
  const menuLinks = document.querySelector(".navbar_menu");

  menu.addEventListener("click", () => {
    menu.classList.toggle("is-active");
    menuLinks.classList.toggle("active");
  });

  
});