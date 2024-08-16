// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Base64Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import {DateTime} from "@quant-finance/solidity-datetime/contracts/DateTime.sol";

import {IVeArtProxy} from "./interfaces/IVeArtProxy.sol";

contract VeArtProxy is IVeArtProxy, Initializable {
    using DateTime for uint256;

    function initialize() public initializer {}

    function _tokenURI(
        uint256 _tokenId,
        uint256 _balanceOf,
        uint256 _locked_end,
        uint256 /*_value*/
    ) external pure returns (string memory output) {
        string memory svg = _generateSVG(_tokenId, _balanceOf, _locked_end);
        string memory json = Base64Upgradeable.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "lock #',
                        toString(_tokenId),
                        '", "description": "Jungl locks can be used to boost gauge yields, vote on token emission, and receive bribes", "image": "data:image/svg+xml;base64,',
                        Base64Upgradeable.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );
        output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
    }

    function _generateSVG(
        uint256 _tokenId,
        uint256 _balanceOf,
        uint256
    ) internal pure returns (string memory svg) {
        return
            string(
                abi.encodePacked(
                    '<?xml version="1.0" encoding="UTF-8"?><svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000"><defs><style>.cls-1{clip-path:url(#clippath);}.cls-2{fill:none;}.cls-2,.cls-3,.cls-4,.cls-5,.cls-6,.cls-7{stroke-width:0px;}.cls-8{letter-spacing:-.02em;}.cls-8,.cls-9,.cls-10{font-family:\'Inter-Regular\',\'inter\',\'Arial\';}.cls-11{font-family:\'Inter-SemiBold\',\'inter\',\'Arial\';font-size:48px;font-weight:600;}.cls-11,.cls-3,.cls-12{fill:#fff;}.cls-11,.cls-4,.cls-12,.cls-13{isolation:isolate;}.cls-14{clip-path:url(#clippath-1);}.cls-9{letter-spacing:-.08em;}.cls-15{letter-spacing:-.03em;}.cls-3{fill-rule:evenodd;}.cls-4{fill:url(#radial-gradient);opacity:.4;}.cls-12{font-size:28px;}.cls-16{font-family:\'Inter-Bold\',\'inter\',\'Arial\';font-weight:700;}.cls-5{fill:#0c1a21;}.cls-6{fill:#1dd656;}.cls-7{fill:#ff0;}</style><clipPath id="clippath"><rect class="cls-2" width="1000" height="1000"/></clipPath><radialGradient id="radial-gradient" cx="-917.76" cy="-1.02" fx="-917.76" fy="-1.02" r="1" gradientTransform="translate(-418.02 828704.36) rotate(90) scale(901.87)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1dd656"/><stop offset="1" stop-color="#0c1a21" stop-opacity="0"/></radialGradient><clipPath id="clippath-1"><rect class="cls-2" x="356.7" y="225.4" width="286.6" height="484.2"/></clipPath></defs><g class="cls-1"><rect class="cls-5" width="1000" height="1000"/><path class="cls-4" d="m1362,1004.3c0-228.6-90.8-447.9-252.5-609.5-161.6-161.7-380.9-252.5-609.5-252.5S52.1,233.1-109.5,394.7c-161.7,161.7-252.5,380.9-252.5,609.6h1724Z"/><g class="cls-14"><path class="cls-6" d="m433.4,518.4c3.3.1,5-1,6.1-4.1,3.4-9.3,7.2-18.6,10.8-27.9,7.6-19.3,15.2-38.7,22.8-58,2-5.1,1.6-5.6-4-5.6h-15.2c-9.7,0-9.8,0-13.2,9.1-10.2,26.7-20.3,53.4-30.4,80.1-2.1,5.4-1.5,6.2,4.5,6.3,6.2,0,12.4-.2,18.6.1h0Z"/><path class="cls-6" d="m643.2,597.6c-.6-25.5-.2-51.1-.1-76.6v-34.9c0-31,.1-62.1,0-93.1,0-4.3-.5-8.6-1.5-12.8-6.9-28.5-22.2-51.8-45.1-70.4-13-10.6-27-19.3-44.2-21.2-4.6-.5-9.2-1.1-14.2-1.7.2-2.3.6-4.4.4-6.5-.4-5.8.8-12.7-1.9-17.3-7.8-13.1-18.3-23.3-36-20.8-3.3.4-7.7-.2-10.2-2.1-14.9-11.3-31.6-15.8-50-14.5-10.7.7-21.7,1.7-29.9,9.2-6.6,6.1-13.7,7.2-22.1,6.9-13.3-.4-22.6,5.8-28.1,18-4.8,10.5-4.1,21.1-1.6,31.8,4.6,20.2,12.5,38.2,32.9,47.8,1.4.7,2.7,3.3,2.7,5.1.3,10.7.4,21.4.1,32-.3,12.3,11.8,29.7,27,30.5,2.6.1,5.2.4,7.8.6,18.2,1.7,35.1-10.2,37.8-28.1,1.5-10,.9-20.4.5-30.6-.2-5,1.7-8.2,5.4-11,2.3-1.7,4.8-3.4,6.7-5.5,9-10.4,8.2-22.3,3.6-33.8-4.7-11.9-15.1-17.5-27.6-17.9-16.7-.5-33.5-.1-50.3-.1-5.6,0-10.7.7-14.8,4.9-.6.7-2.5,1-3.3.5-2.7-1.5-4.5-8.8-3.3-12.8,1.2-3.9,4.5-4.7,7.9-4.8,5.7-.2,11.4-.4,17.1,0,4.2.3,7-1.1,9.7-4.2,12.8-14.7,37.9-15.9,51.7-2.1,7.1,7.1,15.2,8.2,24.4,7.1,3.7-.4,7.5,0,11.2.2,3.4.2,4.6,2.5,4,5.4-.9,4.6-2.2,9.2-3.5,13.8-2,7.2-4.2,14.4-6.1,21.6-.8,3,.5,4.4,3.9,4.3,7.6-.2,15.2-.3,22.7,0,17.2.6,33.5,4.8,46.4,16.5,10.2,9.2,19.8,19.3,28.1,30.1,8.5,11,12.7,24.2,12.5,38.4-.3,25.2-.6,50.5-.7,75.8-.3,40.3-.1,80.5-.7,120.8-.3,21.2-8.5,40-23,55.6-17.3,18.6-38.7,29.2-64.7,30-16.5.5-32-2-44.9-13.3-19.1-16.6-31.7-36.1-27.7-62.8,2.5-16.5,9.9-29.8,25.4-37.6,14-7.1,28.7-7.5,43.4-3.2,11.3,3.4,19.3,10.7,23.6,22,7.4,19.8-6.2,44.1-27.8,44.3-6.4.1-11.4-2.1-15.4-6.7-4.1-4.8-2.8-13.5,2.8-16.6,4.1-2.3,9.1-3,13.3-5.2,3-1.6,6.5-4,7.8-6.9,3.8-8.7-2.4-18.7-11.8-19.4-17.6-1.5-40.1,7.9-45.3,31.4-3.8,17.1,2.7,31.6,16.6,42.3,16.4,12.7,34.9,14.2,53.8,7.1,38-14.1,48.4-63.1,26.4-93.4-25.5-35.1-69.8-40.1-102.9-20.2-24.4,14.7-38.5,37.1-39.7,66-1.5,36.5,13.2,65.4,43.6,85.9,20.7,14,44.4,15.5,68.5,13.4,9.2-.8,18.7-2,27.5-4.8,29.3-9.3,51.4-27.6,66.4-54.3,9.2-16.3,15.3-33.1,14.8-52.1h0Z"/><path class="cls-6" d="m497.4,488c-10.3,0-20.7.1-31-.1-3-.1-4.4.9-5.1,3.9-1.5,6.7-3.3,13.5-5.2,20.1-1.6,5.7-1,6.5,5.1,6.5,28.4,0,56.8-.1,85.2-.1,5.8,0,11.6-.1,17.5,0,3.4.1,5.1-1,4.9-4.8-.3-4.5-.1-9-.1-13.4-.2-11.1-.2-11-11.4-12.1-8.1-.8-16.4-2.5-22.1-8.2-12.2-12.2-21.1-26.1-19.5-44.5,1.6-17.8,13.6-36.9,32.6-41.3,5.5-1.3,11.2-1.9,16.8-2.4,2.8-.3,3.8-1.3,3.7-4-.1-6.8-.2-13.6,0-20.4.1-2.7-.9-3.7-3.5-3.6-3.6.3-7.2.6-10.9.8-21.8,1.4-39.8,10-53.2,27.6-16,21.1-22,55.5-5,84.7,2.1,3.6,4.2,7.2,6.7,11.4-2.4,0-3.9,0-5.5-.1h0Z"/><path class="cls-7" d="m433.9,308.6c6.4,0,12.8-.2,19.2.1,1.9.1,4.5,1.6,5.3,3.1.6,1.2-1.2,3.7-2.4,5.2-.9,1.2-2.4,2-3.8,2.8-4.8,2.7-8,6.9-9.2,12.1-1.3,5.9-2.3,11.9-2.7,17.9-.5,6.5.3,13-.3,19.5-.3,3.2-1.5,7.2-3.8,9-5.9,4.5-13,.3-13.2-7.4-.2-7.8-.1-15.6-.1-23.4,0-12.9-4.5-23.4-16.2-30.1-3.8-2.2-3.6-5.3.5-7,2.5-1,5.3-1.7,8-1.8,6.2-.2,12.4,0,18.7,0h0Z"/></g><rect class="cls-2" y="377.1" width="1050.1" height="470.6"/><path class="cls-3" d="m74.8,890.7c-3,0-5.9,1.2-8,3.3s-3.3,5-3.3,8v6.4c-1.7,0-3.3.7-4.6,1.9s-1.9,2.8-1.9,4.6v14.5c0,1.7.7,3.3,1.9,4.6,1.2,1.2,2.8,1.9,4.6,1.9h22.6c1.7,0,3.3-.7,4.6-1.9,1.2-1.2,1.9-2.8,1.9-4.6v-14.5c0-1.7-.7-3.3-1.9-4.6-1.2-1.2-2.8-1.9-4.6-1.9v-6.4c0-6.3-5.1-11.3-11.3-11.3Zm8,17.7v-6.4c0-2.1-.8-4.2-2.4-5.7-1.5-1.5-3.6-2.4-5.7-2.4s-4.2.8-5.7,2.4c-1.5,1.5-2.4,3.6-2.4,5.7v6.4h16.2Z"/><text class="cls-11" transform="translate(115.69 930.62)"><tspan x="0" y="0">',
                    formatUintToString(_balanceOf, 18),
                    ' JUNGL</tspan></text><g class="cls-13"><text class="cls-12" transform="translate(56.17 78.44)"><tspan class="cls-9" x="0" y="0">T</tspan><tspan class="cls-10" x="15.75" y="0">o</tspan><tspan class="cls-8" x="32.45" y="0">k</tspan><tspan class="cls-10" x="47.05" y="0">en ID: </tspan><tspan class="cls-16" x="130.73" y="0">',
                    toString(_tokenId),
                    "</tspan></text></g></g></svg>"
                )
            );
    }

    /// @notice Converts a timestamp into a formatted date string representation
    /// @param timestamp The timestamp to be converted to a formatted date string
    /// @return string representation of the given timestamp
    function toDateString(
        uint256 timestamp
    ) private pure returns (string memory) {
        (uint256 year, uint256 month, uint256 day) = timestamp
            .timestampToDate();
        string[12] memory monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];
        return
            string(
                abi.encodePacked(
                    toString(day),
                    " ",
                    monthNames[month],
                    ", ",
                    toString(year)
                )
            );
    }

    /// @notice Converts a uint256 value into a string representation
    /// @dev Optimizes for values with 32 digits or less using a bytes32 buffer, otherwise uses a dynamic bytes array
    /// @param value The uint256 value to be converted to a string
    /// @return string representation of the given uint256 value
    function toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        // If the number of digits is more than 32, use a dynamic bytes array.
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            unchecked {
                digits -= 1;
                buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
                value /= 10;
            }
        }
        return string(buffer);
    }

    /// @notice Formats a uint256 value into a string with decimals
    /// @dev The number of decimals specifies the position of the decimal point
    /// @param value The uint256 value to be formatted as a string
    /// @param decimals The number of decimal places
    /// @return A string representing the uint256 value with the given number of decimals
    function formatUintToString(
        uint256 value,
        uint256 decimals
    ) public pure returns (string memory) {
        uint256 mainValue = value / (10 ** decimals);
        string memory mainStr = toString(mainValue);
        uint256 decimalValue = value % (10 ** decimals);
        // return early if decimal value is 0
        if (decimalValue == 0) {
            return mainStr;
        }
        string memory decimalStr = toString(decimalValue);
        decimalStr = padWithZeros(decimalStr, decimals);
        decimalStr = removeTrailingZeros(decimalStr);
        return string(abi.encodePacked(mainStr, ".", decimalStr));
    }

    /// @notice Pads a string with leading zeros until it reaches a specific length
    /// @param str The original string
    /// @param decimals The desired length of the string
    /// @return The string padded with leading zeros
    function padWithZeros(
        string memory str,
        uint256 decimals
    ) private pure returns (string memory) {
        uint256 strLength = bytes(str).length;
        while (strLength < decimals) {
            str = string(abi.encodePacked("0", str));
            unchecked {
                ++strLength;
            }
        }
        return str;
    }

    /// @notice Removes trailing zeros from a string
    /// @param str The original string
    /// @return The string without trailing zeros
    function removeTrailingZeros(
        string memory str
    ) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        uint256 strLength = strBytes.length;
        while (strLength > 0 && strBytes[strLength - 1] == "0") {
            unchecked {
                --strLength;
            }
        }
        return substring(strBytes, 0, strLength);
    }

    /// @notice Extracts a substring from a string
    /// @param strBytes The bytes representation of the original string
    /// @param startIndex The starting index of the substring
    /// @param endIndex The ending index of the substring
    /// @return The extracted substring
    function substring(
        bytes memory strBytes,
        uint256 startIndex,
        uint256 endIndex
    ) private pure returns (string memory) {
        bytes memory result = new bytes(endIndex - startIndex);
        uint256 j = 0;
        for (uint256 i = startIndex; i < endIndex; ) {
            bytes(result)[j] = strBytes[i];
            unchecked {
                ++i;
                ++j;
            }
        }
        return string(result);
    }
}
