// scripts/test-encryption.js - Test encryption functionality
// Note: This script validates that encryption environment variables are set correctly
// For full encryption testing, use the development server or create a TypeScript test

require('dotenv').config()

async function testEncryption() {
  console.log('🧪 Testing SpendScope Encryption Environment Setup\n')

  try {
    // Test environment variables
    console.log('1. Checking required environment variables...')

    const requiredEnvVars = [
      'ENCRYPTION_KEY',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]

    let allEnvVarsSet = true

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} is set`)
      } else {
        console.log(`   ❌ ${envVar} is missing`)
        allEnvVarsSet = false
      }
    }

    // Test encryption key validity
    console.log('\n2. Validating encryption key...')
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (encryptionKey) {
      if (encryptionKey.length >= 64) {
        console.log('   ✅ Encryption key length is sufficient')
      } else {
        console.log('   ❌ Encryption key is too short (minimum 64 characters)')
        allEnvVarsSet = false
      }

      if (encryptionKey !== 'your-generated-encryption-key' &&
          encryptionKey !== 'your-64-character-encryption-key-here-keep-this-very-secure-and-never-share-it') {
        console.log('   ✅ Encryption key appears to be properly generated')
      } else {
        console.log('   ❌ Encryption key is still using placeholder value')
        allEnvVarsSet = false
      }
    }

    // Test email configuration
    console.log('\n3. Checking email 2FA configuration...')
    const emailEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD']
    let emailConfigured = true

    for (const envVar of emailEnvVars) {
      if (process.env[envVar] &&
          process.env[envVar] !== `your-${envVar.toLowerCase().replace('smtp_', '')}` &&
          process.env[envVar] !== 'your-email@gmail.com' &&
          process.env[envVar] !== 'your-16-character-app-password') {
        console.log(`   ✅ ${envVar} is configured`)
      } else {
        console.log(`   ⚠️  ${envVar} needs to be configured for email 2FA`)
        emailConfigured = false
      }
    }

    // Test Plaid configuration
    console.log('\n4. Checking Plaid API configuration...')
    const plaidEnvVars = ['PLAID_CLIENT_ID', 'PLAID_SECRET', 'PLAID_ENV']
    let plaidConfigured = true

    for (const envVar of plaidEnvVars) {
      if (process.env[envVar] && process.env[envVar] !== `your-${envVar.toLowerCase().replace('plaid_', '')}`) {
        console.log(`   ✅ ${envVar} is set`)
      } else {
        console.log(`   ❌ ${envVar} needs to be configured`)
        plaidConfigured = false
      }
    }

    // Summary
    console.log('\n📋 Configuration Summary:')
    console.log(`   Core Environment Variables: ${allEnvVarsSet ? '✅ Complete' : '❌ Incomplete'}`)
    console.log(`   Email 2FA Configuration: ${emailConfigured ? '✅ Complete' : '⚠️  Needs Setup'}`)
    console.log(`   Plaid API Configuration: ${plaidConfigured ? '✅ Complete' : '❌ Needs Setup'}`)

    if (allEnvVarsSet) {
      console.log('\n🎉 Environment setup looks good!')
      console.log('\n📋 Next Steps:')

      if (!emailConfigured) {
        console.log('1. 📧 Configure email 2FA by setting up Gmail App Password or SendGrid')
        console.log('   - Follow the instructions in 2FA_SETUP_GUIDE.md')
      }

      if (!plaidConfigured) {
        console.log('2. 🏦 Configure Plaid API credentials from plaid.com dashboard')
      }

      console.log('3. 🚀 Start your development server: npm run dev')
      console.log('4. 🧪 Test 2FA setup by creating an account and enabling 2FA')

    } else {
      console.log('\n❌ Environment setup is incomplete')
      console.log('   Please run: node scripts/setup-security.js')
      console.log('   And update your .env file with the generated values')
    }

  } catch (error) {
    console.error('\n❌ Environment test failed:', error.message)
    console.error('\nPossible issues:')
    console.error('- .env file not found or not readable')
    console.error('- Missing environment variables')
    process.exit(1)
  }
}

// Run tests
testEncryption().catch(console.error)