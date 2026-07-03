function typedeffect(values) {
  console.log("tset");
  var typed = new Typed("#typed-title", {
    strings: values,
    typeSpeed: 100,
    loop: true,
    cursorChar: "_",
  });
}
