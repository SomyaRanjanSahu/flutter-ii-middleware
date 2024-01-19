import { fromHex } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Ed25519PublicKey, DelegationIdentity, ECDSAKeyIdentity, DelegationChain } from "@dfinity/identity";

const loginButton = document.getElementById("login");
const redirectToAppButton = document.getElementById("redirect");

// Reciveing the session key from the URL
function getQueryParams() {
  const queryParams = new URLSearchParams(window.location.search);
  return {
    publicKey: queryParams.get("sessionkey"),
  }
}

console.log(getQueryParams().publicKey);

const appPublicKey = Ed25519PublicKey.fromDer(fromHex(getQueryParams().publicKey));

let delegationChain;

// Login button
loginButton.onclick = async (e) => {
  e.preventDefault();

  // Creating a middle key indentity
  var middleKeyIdentity = await ECDSAKeyIdentity.generate();
  let authClient = await AuthClient.create({
    identity: middleKeyIdentity,
  });

  await new Promise((resolve) => {
    authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app"
          : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`,
      onSuccess: () => {
        resolve;
        redirectToAppButton.removeAttribute("disabled");
        loginButton.setAttribute("disabled", true);
        handleSuccessfulLogin(authClient, middleKeyIdentity);
      },
    });
  });
  return false;
};

async function handleSuccessfulLogin(authClientInstance, middleKeyIdentity) {

  const middleIdentity = authClientInstance.getIdentity();

  // Delegated Principal
  console.log('middle identity', middleIdentity.getPrincipal().toString())

  document.getElementById("loginStatus").textContent = "You are logged in ✅";
  document.getElementById("principalId").textContent = "ID: " + middleIdentity.getPrincipal().toString();

  // Creating Delegation Chain
  if (appPublicKey != null && middleIdentity instanceof DelegationIdentity) {
    let middleToApp = await DelegationChain.create(
      middleKeyIdentity,
      appPublicKey,
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      { previous: middleIdentity.getDelegation() },
    );

    delegationChain = middleToApp;
  }

  var delegationString = JSON.stringify(
    delegationChain.toJSON()
  );

  const encodedDelegation = encodeURIComponent(delegationString);

  redirectToAppButton.onclick = async (e) => {
    e.preventDefault();
    window.location.href = `auth://callback/login?del=${encodedDelegation}`;
    loginButton.removeAttribute("disabled");
  };

}
