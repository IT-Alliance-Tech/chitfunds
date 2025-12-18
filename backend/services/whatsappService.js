const generateWhatsappLink = ({ phone, message }) => {
  if (!phone) return null;

  const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

module.exports = {
  generateWhatsappLink,
};
