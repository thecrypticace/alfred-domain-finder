module.exports = {
  hover: {
    // Username / Password doesn't work yet…
    // Or maybe it only works w/ accounts w/o 2FA?
    // username: "alice",
    // password: "yeahmypasswordisalldots",

    // But this approach does!
    cookies: [
      "hoverauth=cookie_value_here",
    ],
  }
}
