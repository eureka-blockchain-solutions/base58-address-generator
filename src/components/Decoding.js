import React, { Component, Fragment } from "react";
import styled from "styled-components";
import { InputField } from "../views/design-components/Inputs";
import bs58 from "bs58";
import web3 from "web3";
import LottieControl from "../views/LottieManager";
import animationData from "../views/animations/animation-w60-h45";
import { ConvertButton, ConvertContainer } from "./Encoding";
import DecodingResult from "../views/DecodingResult";
import { EndPrefix, InitialPrefix } from "../constants/Prefix";
import { ALLOWED_CHARACTERS_BS58 } from "../constants/Base58Characters";
import crypto from "crypto";
import sha256 from "sha256";

const Container = styled.div``;
const Label = styled.label`
  font-size: 15px;
  font-weight: bold;
`;

class Decoding extends Component {
  constructor() {
    super();
    this.state = {
      status: null,
      ekaAddress: null,
      decodedAddress: null,
      isConverting: false
    };
  }

  componentDidMount() {}

  static areCharactersAllowedByBS58(value) {
    let flat = true;
    for (let i = 0; i < value.length; i++) {
      const c = value.charAt(i).toString();
      if (!(ALLOWED_CHARACTERS_BS58.indexOf(c) > -1)) {
        // character is not in the array and thus is not a valid character
        flat = false;
      }
    }
    return flat;
  }

  // checks if there is prefix. If yes, it gets removed
  static removePrefix(value) {
    if (value.includes(InitialPrefix) && value.includes(EndPrefix)) {
      return value
        .toString()
        .replace(InitialPrefix, "")
        .replace(EndPrefix, "");
    }
    return value;
  }

  isValueValid(value) {
    if (!Decoding.areCharactersAllowedByBS58(value)) {
      return false;
    } else {
      const potentialAddress = bs58
        .decode(Decoding.removePrefix(value))
        .toString("hex");
      return !!web3.utils.isAddress(potentialAddress);
    }
  }

  checkStatus(value) {
    // remove prefix
    value = value.includes(InitialPrefix)
      ? value.substr(InitialPrefix.length)
      : value;
    if (this.isCheckSum(value)) {
      this.setState({ status: "valid", ekaAddress: value });
    } else {
      this.setState({ status: "error", ekaAddress: value });
    }
  }

  isCheckSum(value) {
    if (!Decoding.areCharactersAllowedByBS58(value)) {
      return false;
    }
    let flag = true;
    const buffer = new Buffer(bs58.decode(value));
    const address = buffer.slice(0, -2);
    const checksum = buffer.slice(-2);
    let hash = new Buffer(sha256(sha256(address)));
    checksum.forEach((digit, i) => {
      if (digit !== hash[i]) {
        flag = false;
      }
    });

    return flag;
  }

  decode() {
    this.setState({ isConverting: true });
    if (this.isCheckSum(this.state.ekaAddress)) {
      const buffer = new Buffer(bs58.decode(this.state.ekaAddress));
      const decodedAddress = web3.utils.toChecksumAddress(
        "0x" + buffer.slice(0, -2).toString("hex")
      );
      this.setState({ decodedAddress });
    }
  }

  render() {
    return (
      <Container>
        <Label>EKA Address</Label>
        <InputField
          onChange={e => {
            this.checkStatus(e.target.value);
          }}
          status={this.state.status}
          placeholder={"EKA3PTEBL6UqrZn1zJNxgewtbUQ5UNWxy"}
        />
        <ConvertContainer>
          <ConvertButton
            status={this.state.status}
            onClick={async () => {
              await this.decode();
            }}
          >
            Decode
            <LottieControl
              animationData={animationData}
              onComplete={() => {
                this.setState({ isConverting: false });
              }}
              isPaused={!this.state.isConverting}
              width={30}
            />
          </ConvertButton>
        </ConvertContainer>

        {this.state.decodedAddress ? (
          <Fragment>
            <DecodingResult
              decodedAddress={this.state.decodedAddress}
              ekaAddress={this.state.ekaAddress}
            />
          </Fragment>
        ) : null}
      </Container>
    );
  }
}

export default Decoding;
