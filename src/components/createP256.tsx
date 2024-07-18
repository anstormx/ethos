"use client";

import {
  useRouter
} from "next/navigation";
import Icon from "@/components/icon";
import { toast } from "react-toastify";


import React, { useState, useRef, useEffect } from "react";
import { browserSupportsWebAuthn, browserSupportsWebAuthnAutofill, platformAuthenticatorIsAvailable, startAuthentication, startRegistration } from "@simplewebauthn/browser";
// @ts-ignore
import elliptic from "elliptic";
import base64url from "base64url";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import { AsnParser } from "@peculiar/asn1-schema";
import { ECDSASigValue } from "@peculiar/asn1-ecc";
import { utils } from "@passwordless-id/webauthn";
import * as cbor from "../utils/cbor";
import {
  parseAuthData,
  publicKeyCredentialToJSON,
  shouldRemoveLeadingZero,
} from "../utils/helpers";
import entryPointAbi from "../utils/abi.json";
import { ethers, keccak256 } from "ethers";  
const EC = elliptic.ec;
const ec = new EC("p256");

export enum COSEKEYS {
    kty = 1,
    alg = 3,
    crv = -1,
    x = -2,
    y = -3,
    n = -1,
    e = -2,
}

export default function CreateP256() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [publicKeys, setPublicKeys] = useState([] as any[]);
  const [publicKey, setPublicKey] = useState("");
  const [signature, setSignature] = useState("");

  const router = useRouter();

  const createPassKey = async () => {
    setLoading(true);

    if (!(browserSupportsWebAuthn())) {
      toast.error("WebAuthn is not supported in this browser");
      setLoading(false);
      return;
    }

    if (!(await platformAuthenticatorIsAvailable())) {
      toast.error("Platform authenticator is not available");
      setLoading(false);
      return;
    }

    // const platform = await platformAuthenticatorIsAvailable() ? "platform" : "cross-platform";
    const platform = "cross-platform";

    const username = "ethos-wallets";
    const challenge = uuidv4();
    const obj = {
      rp: {
        name: "ethos wallets",
        id: window.location.hostname,
      },
      user: {
        id: username,
        name: username,
        displayName: username,
      },
      challenge: challenge,
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      attestation: "direct",
      timeout: 60000,
      authenticatorSelection: {
        userVerification: "required",
        authenticatorAttachment: platform,
      },
    };
  
    let publicKeyCredential;
    try {
      publicKeyCredential = await startRegistration(obj as any);
    } catch (error) {
      toast.error("Error creating passkey, check console for more details");
      console.log(error);
      setLoading(false);
      return;
    }

    const attestationObject = base64url.toBuffer(
      publicKeyCredential.response.attestationObject
    );

    const authData = cbor.decode(attestationObject.buffer, undefined, undefined).authData as Uint8Array;

    let authDataParsed = parseAuthData(authData);

    let pubk = cbor.decode(
      authDataParsed.COSEPublicKey.buffer,
      undefined,
      undefined
    );

    const x = pubk[COSEKEYS.x];
    const y = pubk[COSEKEYS.y];

    const pk = ec.keyFromPublic({ x, y });

    const publicKey = [
      "0x" + pk.getPublic("hex").slice(2, 66),
      "0x" + pk.getPublic("hex").slice(-64),
    ];

    // Convert x and y to hex strings, ensuring they are 32 bytes each
    const xHex = Buffer.from(x).toString('hex').padStart(64, '0');
    const yHex = Buffer.from(y).toString('hex').padStart(64, '0');

    // Concatenate with '04' prefix for uncompressed public key
    const uncompressedPubKey = '04' + xHex + yHex;

    // Hash using Keccak-256
    const hash = keccak256(Buffer.from(uncompressedPubKey, 'hex'));

    // Take the last 20 bytes
    const ethereumAddress = '0x' + hash.slice(-40);
    console.log("ethereumAddress", ethereumAddress);

    setPublicKey(ethereumAddress);
    setCredentials(publicKeyCredential);
    setPublicKeys(publicKey);
    toast.success("Passkey created successfully");
    setLoading(false);
    };

  
  return (
    <main className="flex flex-col py-6 items-center gap-5">
      <h1 className="text-5xl font-bold">gen passkey</h1>
      <p className="text-gray-400">
        create a new wallet using webauthn
      </p>
      <div className="flex flex-col gap-6 max-w-sm w-full"> 
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-l-white items-center justify-center mx-auto" />
          ):(
            <button
            className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
          onClick={createPassKey}
            >
          create passkey
            </button>
        )}
      </div>
      {publicKeys.length > 0 && (
      <>
        <div className="mt-5 text-base">public key generated, use this key to create a wallet</div>
        <div className="flex flex-col gap-5">
          <li>x: {publicKeys[0]}</li>
          <li>y: {publicKeys[1]}</li>
          <li>key: {publicKey}</li>
        </div>
      </>
    )}
  </main>
);}