// lib/transaction-categorizer.ts

export interface TransactionCategorizationInput {
  merchantName?: string | null;
  originalDescription?: string | null;
  plaidCategory?: string[];
  personalFinanceCategory?: any;
  amount: number;
}

export interface CategoryResult {
  category: string;
  subcategory?: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'personal_finance' | 'merchant_match' | 'keyword_match' | 'plaid_category' | 'fallback';
}

// Standard categories we want to use
export const STANDARD_CATEGORIES = {
  'Food & Dining': ['restaurants', 'fast food', 'coffee', 'groceries', 'food delivery'],
  'Transportation': ['gas', 'parking', 'public transport', 'rideshare', 'car maintenance'],
  'Shopping': ['retail', 'online shopping', 'clothing', 'electronics', 'home goods'],
  'Entertainment': ['movies', 'games', 'streaming', 'events', 'hobbies'],
  'Bills & Utilities': ['electricity', 'gas bill', 'water', 'internet', 'phone', 'insurance'],
  'Healthcare': ['doctor', 'pharmacy', 'hospital', 'dental', 'medical'],
  'Travel': ['hotels', 'flights', 'vacation', 'accommodation'],
  'Personal Care': ['haircut', 'beauty', 'gym', 'wellness'],
  'Education': ['tuition', 'books', 'courses', 'training'],
  'Income': ['salary', 'freelance', 'refund', 'cashback'],
  'Transfer': ['bank transfer', 'payment', 'deposit'],
  'Other': []
};

// Merchant name patterns for high-confidence matching
const MERCHANT_PATTERNS = {
  'Food & Dining': [
    // Fast Food
    'mcdonald', 'burger king', 'kfc', 'taco bell', 'subway', 'domino', 'pizza hut',
    'wendy', 'chick-fil-a', 'chipotle', 'panda express', 'five guys', 'in-n-out',

    // Coffee
    'starbucks', 'dunkin', 'coffee bean', 'caribou coffee', 'peet',

    // Restaurants
    'restaurant', 'bistro', 'cafe', 'diner', 'grill', 'bar & grill',

    // Delivery
    'doordash', 'uber eats', 'grubhub', 'postmates', 'seamless',

    // Groceries
    'walmart', 'target', 'kroger', 'safeway', 'whole foods', 'trader joe',
    'costco', 'sam\'s club', 'aldi', 'publix', 'wegmans', 'giant eagle'
  ],

  'Transportation': [
    'shell', 'exxon', 'bp', 'chevron', 'mobil', 'valero', 'speedway',
    'uber', 'lyft', 'taxi', 'parking', 'metro', 'mta', 'bart',
    'jiffy lube', 'valvoline', 'midas', 'firestone', 'autozone'
  ],

  'Shopping': [
    'amazon', 'ebay', 'walmart', 'target', 'best buy', 'home depot',
    'lowe\'s', 'macy\'s', 'nordstrom', 'tj maxx', 'marshall', 'ross',
    'old navy', 'gap', 'h&m', 'zara', 'uniqlo'
  ],

  'Entertainment': [
    'netflix', 'hulu', 'disney', 'spotify', 'apple music', 'amazon prime',
    'movie', 'cinema', 'theater', 'amc', 'regal', 'steam', 'playstation',
    'xbox', 'nintendo', 'twitch'
  ],

  'Bills & Utilities': [
    'electric', 'electricity', 'gas company', 'water dept', 'comcast',
    'verizon', 'at&t', 't-mobile', 'sprint', 'xfinity', 'spectrum',
    'geico', 'state farm', 'allstate', 'progressive', 'usaa'
  ],

  'Healthcare': [
    'cvs', 'walgreens', 'rite aid', 'pharmacy', 'hospital', 'medical',
    'doctor', 'dental', 'dentist', 'urgent care', 'clinic'
  ],

  'Travel': [
    'marriott', 'hilton', 'hyatt', 'holiday inn', 'best western',
    'american airlines', 'delta', 'united', 'southwest', 'jetblue',
    'expedia', 'booking.com', 'airbnb', 'vrbo'
  ],

  'Personal Care': [
    'supercuts', 'great clips', 'salon', 'spa', 'gym', 'fitness',
    '24 hour fitness', 'planet fitness', 'la fitness', 'equinox'
  ]
};

// Keyword patterns for description matching
const DESCRIPTION_KEYWORDS = {
  'Food & Dining': [
    'restaurant', 'food', 'dining', 'cafe', 'coffee', 'lunch', 'dinner',
    'breakfast', 'grocery', 'market', 'deli', 'bakery', 'pizza', 'burger'
  ],
  'Transportation': [
    'gas', 'fuel', 'gasoline', 'parking', 'toll', 'metro', 'bus', 'train',
    'uber', 'lyft', 'taxi', 'rideshare', 'car wash', 'oil change'
  ],
  'Bills & Utilities': [
    'electric', 'electricity', 'gas bill', 'water', 'sewer', 'internet',
    'cable', 'phone', 'mobile', 'insurance', 'rent', 'mortgage'
  ],
  'Healthcare': [
    'medical', 'doctor', 'physician', 'hospital', 'pharmacy', 'prescription',
    'dental', 'vision', 'health', 'clinic', 'urgent care'
  ],
  'Shopping': [
    'purchase', 'retail', 'store', 'shop', 'mall', 'outlet', 'market'
  ],
  'Entertainment': [
    'movie', 'cinema', 'theater', 'concert', 'show', 'game', 'entertainment',
    'streaming', 'subscription', 'music', 'video'
  ],
  'Income': [
    'payroll', 'salary', 'wages', 'freelance', 'refund', 'cashback',
    'dividend', 'interest', 'bonus', 'commission'
  ],
  'Transfer': [
    'transfer', 'payment', 'deposit', 'withdrawal', 'ach', 'wire'
  ]
};

// Plaid personal finance category mapping
const PERSONAL_FINANCE_MAPPING: Record<string, string> = {
  'FOOD_AND_DRINK': 'Food & Dining',
  'TRANSPORTATION': 'Transportation',
  'SHOPS': 'Shopping',
  'ENTERTAINMENT': 'Entertainment',
  'PERSONAL_CARE': 'Personal Care',
  'GENERAL_MERCHANDISE': 'Shopping',
  'HOME_IMPROVEMENT': 'Shopping',
  'MEDICAL': 'Healthcare',
  'BANK_FEES': 'Bills & Utilities',
  'GOVERNMENT_AND_NON_PROFIT': 'Bills & Utilities',
  'TRAVEL': 'Travel',
  'RENT_AND_UTILITIES': 'Bills & Utilities'
};

export function categorizeTransaction(input: TransactionCategorizationInput): CategoryResult {
  const {
    merchantName,
    originalDescription,
    plaidCategory,
    personalFinanceCategory,
    amount
  } = input;

  // Method 1: Use Plaid's Personal Finance Category (highest confidence)
  if (personalFinanceCategory?.primary) {
    const pfcPrimary = personalFinanceCategory.primary.toUpperCase();
    const mappedCategory = PERSONAL_FINANCE_MAPPING[pfcPrimary];

    if (mappedCategory) {
      return {
        category: mappedCategory,
        subcategory: personalFinanceCategory.detailed || undefined,
        confidence: 'high',
        source: 'personal_finance'
      };
    }
  }

  // Method 2: Merchant name pattern matching (high confidence)
  if (merchantName) {
    const merchant = merchantName.toLowerCase();

    for (const [category, patterns] of Object.entries(MERCHANT_PATTERNS)) {
      for (const pattern of patterns) {
        if (merchant.includes(pattern)) {
          return {
            category,
            confidence: 'high',
            source: 'merchant_match'
          };
        }
      }
    }
  }

  // Method 3: Description keyword matching (medium confidence)
  const description = (originalDescription || merchantName || '').toLowerCase();

  for (const [category, keywords] of Object.entries(DESCRIPTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (description.includes(keyword)) {
        return {
          category,
          confidence: 'medium',
          source: 'keyword_match'
        };
      }
    }
  }

  // Method 4: Use existing Plaid category (low confidence)
  if (plaidCategory && plaidCategory[0] && plaidCategory[0] !== 'Other') {
    // Map common Plaid categories to our standard categories
    const plaidCat = plaidCategory[0];
    const plaidMapping: Record<string, string> = {
      'Food and Drink': 'Food & Dining',
      'Shops': 'Shopping',
      'Recreation': 'Entertainment',
      'Service': 'Personal Care',
      'Healthcare': 'Healthcare',
      'Transportation': 'Transportation',
      'Travel': 'Travel',
      'Payment': 'Transfer',
      'Deposit': 'Income'
    };

    const mappedCategory = plaidMapping[plaidCat] || plaidCat;

    return {
      category: mappedCategory,
      subcategory: plaidCategory[1] || undefined,
      confidence: 'low',
      source: 'plaid_category'
    };
  }

  // Method 5: Amount-based heuristics for special cases
  if (amount < 0) { // Negative amounts are typically income/refunds
    return {
      category: 'Income',
      confidence: 'medium',
      source: 'fallback'
    };
  }

  // Final fallback
  return {
    category: 'Other',
    confidence: 'low',
    source: 'fallback'
  };
}

// Helper function to get category color for UI
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Food & Dining': '#ef4444',      // red
    'Transportation': '#3b82f6',     // blue
    'Shopping': '#8b5cf6',           // purple
    'Entertainment': '#f59e0b',      // amber
    'Bills & Utilities': '#6b7280',  // gray
    'Healthcare': '#10b981',         // emerald
    'Travel': '#06b6d4',             // cyan
    'Personal Care': '#ec4899',      // pink
    'Education': '#84cc16',          // lime
    'Income': '#22c55e',             // green
    'Transfer': '#64748b',           // slate
    'Other': '#9ca3af'               // gray-400
  };

  return colors[category] || colors['Other'];
}

// Helper function to get category icon
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Food & Dining': '🍽️',
    'Transportation': '🚗',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Bills & Utilities': '💡',
    'Healthcare': '🏥',
    'Travel': '✈️',
    'Personal Care': '💄',
    'Education': '📚',
    'Income': '💰',
    'Transfer': '💳',
    'Other': '📋'
  };

  return icons[category] || icons['Other'];
}