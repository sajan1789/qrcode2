import React, { useState } from "react";
import axios from "axios";
import QrScanner from "react-qr-scanner";
import jsQR from "jsqr";
import alliedLogo from "../assets/AlliedLogo.png"; // Ensure correct path
import { motion } from "framer-motion"; // For animations
import toast from "react-hot-toast";
import { formatRole } from "../utils/roles";
import { useNavigate } from "react-router-dom";

const QRCodeComponent = () => {
  const [accessDetails, setAccessDetails] = useState({
    macAddress: "",
    encryptedData: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const LoggeedInRole = JSON.parse(localStorage.getItem("userRoles"));
  const [encryptedData, setEncryptedData] = useState(null); // Initialize as null
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [qrCodeData, setQrCodeData] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [isLoadingPin, setIsLoadingPin] = useState(false);
  const [showPinPage, setShowPinPage] = useState(false);
  const [guid, setGuid] = useState("");
  const [pin, setPin] = useState(null);
  const [error, setError] = useState(null);

  // Parse QR code data
  const parseQrCodeData = (data) => {
    console.log(data, "datadatadata");
    try {
      const parsed = JSON.parse(data);
      return {
        macAddress: parsed.macAddress || "",
        encryptedData: parsed.encryptedData || "",
      };
    } catch {
      setError("Invalid QR code format");
      return null;
    }
  };

  // Handle QR code scan result
  const handleQrCodeResult = async (result) => {
    if (!result) return;
    setQrCodeData(result.text);
    const parsedData = parseQrCodeData(result.text);
    if (!parsedData) return;

    setAccessDetails(parsedData);
    setIsScanning(false);

    try {
      const secretKeyData = await getSecretKey(parsedData.macAddress);
      console.log("secretKeyData", secretKeyData);
      const decryptedData = await decryptData(
        parsedData.macAddress,
        parsedData.encryptedData
      );
      console.log(decryptedData.decrypted);
      setGuid(decryptedData.decrypted.guid);
      const formattedDecrypted = {
        ...decryptedData.decrypted,
        role: formatRole(decryptedData.decrypted.role),
      };

      setEncryptedData(formattedDecrypted);
    } catch (err) {
      setError("Failed to process QR code");
    }
  };

  // Get secret key
  const getSecretKey = async (macAddress) => {
    try {
      const response = await axios.post(`${baseUrl}/get-secret-key`, {
        macAddress,
      });
      const secretKey = response.data.secretKey;
      if (secretKey) localStorage.setItem("secretKey", secretKey);
      return response.data;
    } catch {
      throw new Error("Failed to fetch secret key");
    }
  };

  // Decrypt data

  const decryptData = async (macAddress, encryptedData) => {
    try {
      const response = await axios.post(`${baseUrl}/decrypt`, {
        macAddress,
        encryptedData,
      });

      return response.data;
    } catch {
      throw new Error("Decryption failed");
    }
  };

  // Generate PIN
  const generatePin = async (macAddress, guid, role, secretKey) => {
    try {
      const response = await axios.post(`${baseUrl}/generate-pin`, {
        macAddress,
        guid,
        role,
        secretKey,
      });
      return response.data.generated_pin;
    } catch {
      throw new Error("Failed to generate PIN");
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code) handleQrCodeResult({ text: code.data });
        else setError("No QR code found in image");
      };
    };
    reader.readAsDataURL(file);
  };

  // Generate PIN click handler
  const handleGeneratePinClick = async () => {
    setIsLoadingPin(true);
    setError(null);
    const rawRole = JSON.parse(localStorage.getItem("userRoles"));

    const roleMap = {
      Admin: "admin",
      Maintainer: "maintainer",
    };
    const role = roleMap[rawRole] || "service_engineer";
    const secretKey = localStorage.getItem("secretKey");

    try {
      const generatedPin = await generatePin(
        accessDetails.macAddress,
        guid,
        role,
        secretKey
      );
      setPin(generatedPin);
      setShowPinPage(true);
    } catch {
      setError("Failed to generate PIN");
    } finally {
      setIsLoadingPin(false);
    }
  };
  // Go back
  const handleGoBack = () => {
    navigate("/menu");
  };
  // Reset scanner
  const resetScanner = () => {
    setIsScanning(true);
    setShowPinPage(false);
    setQrCodeData("");
    setAccessDetails({ macAddress: "", encryptedData: "" });
    setEncryptedData(null);
    setPin(null);
    setError(null);
  };

  // Toggle back to scanned data
  const showScannedData = () => {
    setShowPinPage(false);
  };
  const handleClick = () => {
    if (encryptedData.role !== LoggeedInRole) {
      setErrorMessage("Machine role is not same as logged-in role");
      return;
    }
    setErrorMessage(""); // clear any previous error
    handleGeneratePinClick();
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Logo */}
      <motion.img
        src={alliedLogo}
        alt="Allied Medical Ltd Logo"
        className="w-24 sm:w-28 h-24 sm:h-28 mb-6 object-contain"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Title */}
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 sm:mb-8 text-center tracking-tight"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        QR Code Access System
      </motion.h1>

      {/* Main Content */}
      <motion.div
        className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md bg-opacity-90"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {showPinPage ? (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
              Your PIN
            </h2>
            <div className="flex space-x-2 sm:space-x-3 mb-6 sm:mb-8">
              {pin
                ?.toString()
                .split("")
                .map((digit, index) => (
                  <motion.div
                    key={index}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-md"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {digit}
                  </motion.div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <motion.button
                onClick={showScannedData}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Scanned Data
              </motion.button>
              <motion.button
                onClick={resetScanner}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Scan Another QR Code
              </motion.button>
              <motion.button
            onClick={handleGoBack}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
             Go Back
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            {isScanning ? (
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-full max-w-[300px] sm:max-w-[400px] aspect-square rounded-lg overflow-hidden shadow-lg">
                  <QrScanner
                    delay={300}
                    onError={(err) => setError(err.message)}
                    onScan={handleQrCodeResult}
                    style={{ width: "100%" }}
                    constraints={{
                      video: { facingMode: "environment" },
                    }}
                  />
                  <div className="absolute inset-0 border-4 border-transparent rounded-lg pointer-events-none scan-border" />
                </div>
                <p className="text-gray-600 mt-4 text-center text-sm sm:text-base">
                  Scan a QR code to proceed
                </p>

                <div className="flex items-center gap-4 mt-4 sm:mt-6 w-full max-w-md">
                  {/* Upload File Label */}
                  <label className="flex-1 text-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg cursor-pointer hover:from-green-600 hover:to-teal-600 transition-all shadow-md text-sm sm:text-base">
                    Upload QR Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {/* Go Back Button */}
                  <button
                    onClick={handleGoBack}
                    className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md text-sm sm:text-base"
                  >
                    Go Back
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                  QR Code Scanned
                </h2>

                <div className="w-full space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <p className="text-gray-700 text-sm sm:text-base">
                    <strong>MAC Address:</strong> {accessDetails.macAddress}
                  </p>

                  {encryptedData && (
                    <div className="p-4 bg-gray-50 rounded-lg shadow-inner text-sm sm:text-base">
                      <p>
                        <strong>Board Version:</strong>{" "}
                        {encryptedData.boardVersion}
                      </p>
                      <p>
                        <strong>Embedded Version:</strong>{" "}
                        {encryptedData.embeddedVersion}
                      </p>
                      <p>
                        <strong>Sl No:</strong> {encryptedData.serialNumber}
                      </p>
                      <p>
                        <strong>Hardware Version:</strong>{" "}
                        {encryptedData.hardwareVersion}
                      </p>
                      <p>
                        <strong>Role:</strong> {encryptedData.role}
                      </p>
                      <p>
                        <strong>Software Version:</strong>{" "}
                        {encryptedData.softwareVersion}
                      </p>
                    </div>
                  )}
                </div>
                {encryptedData && encryptedData.role === LoggeedInRole && (
                  <div className="flex items-center gap-4 mt-4 sm:mt-6 w-[100%]">
                    {/* Generate PIN Button */}
                    <motion.button
                      onClick={handleClick}
                      disabled={isLoadingPin}
                      className={`flex-1 px-4 py-2 sm:px-6 sm:py-3 text-white rounded-lg shadow-md transition-all text-sm sm:text-base ${
                        isLoadingPin
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      }`}
                      whileHover={{ scale: isLoadingPin ? 1 : 1.05 }}
                      whileTap={{ scale: isLoadingPin ? 1 : 0.95 }}
                    >
                      {encryptedData.role === ""
                        ? "No Role Assigned"
                        : "Generate PIN"}
                    </motion.button>

                    {/* Go Back Button */}
                    <button
                      onClick={handleGoBack}
                      className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md text-sm sm:text-base"
                    >
                      Go Back
                    </button>
                  </div>
                )}

                {encryptedData && encryptedData.role !== LoggeedInRole && (
                  <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center text-center">
                    <p className="text-red-500 text-sm mb-3">
                      Machine role is not same as logged-in role
                    </p>

                    <button
                      onClick={handleGoBack}
                      className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md text-sm sm:text-base"
                    >
                      Go Back
                    </button>
                  </div>
                )}

                {/* ✅ Conditionally show the error message below the button */}
                {errorMessage && (
                  <p className="text-red-500 mt-2 text-sm">{errorMessage}</p>
                )}
              </motion.div>
            )}
          </>
        )}

        {/* Error Message */}
        {error && (
          <motion.p
            className="text-red-500 text-center mt-4 sm:mt-6 font-medium text-sm sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default QRCodeComponent;
