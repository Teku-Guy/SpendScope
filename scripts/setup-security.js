// scripts/setup-security.js - Setup encryption keys and validate security configuration
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

console.log('🔐 SpendScope Security Setup\n')

// Generate encryption key
const encryptionKey = crypto.randomBytes(64).toString('hex')
console.log('✅ Generated 64-byte encryption key')

// Generate NextAuth secret
const nextAuthSecret = crypto.randomBytes(32).toString('base64')
console.log('✅ Generated NextAuth secret')

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env')
const envExamplePath = path.join(process.cwd(), '.env.example')

if (fs.existsSync(envPath)) {
  console.log('\n⚠️  .env file already exists. Please manually add the following values:')
} else {
  console.log('\n📝 Creating .env file from template...')

  if (fs.existsSync(envExamplePath)) {
    // Copy .env.example to .env
    let envContent = fs.readFileSync(envExamplePath, 'utf8')

    // Replace placeholders
    envContent = envContent
      .replace('your-64-character-encryption-key-here-keep-this-very-secure-and-never-share-it', encryptionKey)
      .replace('your-nextauth-secret-here-make-it-long-and-secure', nextAuthSecret)

    fs.writeFileSync(envPath, envContent)
    console.log('✅ Created .env file with secure defaults')
  }
}

console.log('\n🔑 Your Security Keys:\n')
console.log(`ENCRYPTION_KEY="${encryptionKey}"`)
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`)

console.log('\n🛡️  Security Checklist:')
console.log('□ Add ENCRYPTION_KEY to your environment variables')
console.log('□ Add NEXTAUTH_SECRET to your environment variables')
console.log('□ Configure SMTP settings for email 2FA')
console.log('□ Set up Plaid API credentials')
console.log('□ Never commit .env file to version control')
console.log('□ Use different keys for production environment')
console.log('□ Regularly rotate encryption keys')
console.log('□ Enable database encryption at rest')
console.log('□ Use HTTPS in production')

console.log('\n📋 Next Steps:')
console.log('1. Update your .env file with the generated keys above')
console.log('2. Configure your SMTP settings for email 2FA')
console.log('3. Set up your Plaid API credentials')
console.log('4. Run: npx prisma db push to apply database schema')
console.log('5. Test encryption with: node scripts/test-encryption.js')

console.log('\n⚠️  IMPORTANT SECURITY NOTES:')
console.log('- Keep your ENCRYPTION_KEY secure - losing it means losing access to encrypted data')
console.log('- Use environment variables in production, never hard-code secrets')
console.log('- Regularly backup your encryption keys in a secure location')
console.log('- Monitor for unauthorized access attempts')