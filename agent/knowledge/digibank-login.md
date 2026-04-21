# digibank Login Page Help

Help for users on the "digibank by DBS" login page. The page has two input
fields (Username, Password) and three helper links: "To link LVB or DBS
account — Tap here", "Forgot Username or Password", and "New to digibank?
Download the app".

## The fields

- **Username:** The User ID created during digibank registration. It is
  not your Customer ID, not your account number, and not your mobile
  number. If the user can't remember it, they should use the "Forgot
  Username or Password" link.
- **Password:** The digibank Internet Banking password. This is **not**
  the mPIN used to unlock the digibank mobile app. If they've only ever
  used the app, they may not have set a web password yet — in that case
  they likely need to go through the Forgot Username or Password flow to
  set one.

## "To link LVB or DBS account — Tap here"

This is for customers of Lakshmi Vilas Bank (merged into DBS Bank India
in November 2020) who want to link their existing LVB or legacy DBS
account into digibank. The typical flow needs the CIF / customer number,
the mobile number registered with the bank, and an OTP. For anything
beyond those general steps, direct the user to a DBS banker.

## "Forgot Username or Password"

A self-service recovery flow. It usually asks for:

- Customer ID or the mobile number registered with the bank
- An OTP sent to that registered mobile
- In some cases, debit card details on a separate device

Safety note: never type debit card details on a public or shared
machine. If the user isn't on their own device, tell them to wait until
they are.

## "New to digibank? Download the app"

digibank registration happens inside the mobile app — web login only
works after the user has already registered through the app. If the user
is trying to sign up and has landed on the web login, redirect them to
download the digibank app from the Play Store or App Store and register
there first.

## Common stuck points

- **"My account is locked after too many wrong password attempts."**
  The account usually unlocks automatically after about 24 hours, or the
  user can reset immediately via "Forgot Username or Password". Don't
  quote exact unlock timing — it's safer to say "usually unlocks after
  24 hours, or use the Forgot flow now."
- **"I'm not getting the OTP."** Ask the user to check mobile signal,
  confirm the registered mobile number is still with them, and check
  the SMS spam folder. If the registered number has changed, it must be
  updated at a branch — that can't be done through the chatbot.
- **"I'm sure my password is correct but it says wrong."** Remind them
  the Password field takes the digibank web password, not the mPIN from
  the mobile app. Caps Lock is also the usual culprit.
- **"Where do I find my Customer ID?"** It's on the welcome letter from
  DBS, on the passbook, or in the digibank app under Profile. Do not
  ask the user to share it in chat.
