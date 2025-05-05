import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
         // Define prose colors using CSS variables
         prose: {
            body: 'hsl(var(--prose-body))',
            headings: 'hsl(var(--prose-headings))',
            lead: 'hsl(var(--prose-lead))',
            links: 'hsl(var(--prose-links))',
            bold: 'hsl(var(--prose-bold))',
            counters: 'hsl(var(--prose-counters))',
            bullets: 'hsl(var(--prose-bullets))',
            hr: 'hsl(var(--prose-hr))',
            quotes: 'hsl(var(--prose-quotes))',
            'quote-borders': 'hsl(var(--prose-quote-borders))',
            captions: 'hsl(var(--prose-captions))',
            code: 'hsl(var(--prose-code))',
            'pre-code': 'hsl(var(--prose-pre-code))',
            'pre-bg': 'hsl(var(--prose-pre-bg))',
            'th-borders': 'hsl(var(--prose-th-borders))',
            'td-borders': 'hsl(var(--prose-td-borders))',
            invert: { // Invert colors for dark mode
              body: 'hsl(var(--prose-invert-body))',
              headings: 'hsl(var(--prose-invert-headings))',
              lead: 'hsl(var(--prose-invert-lead))',
              links: 'hsl(var(--prose-invert-links))',
              bold: 'hsl(var(--prose-invert-bold))',
              counters: 'hsl(var(--prose-invert-counters))',
              bullets: 'hsl(var(--prose-invert-bullets))',
              hr: 'hsl(var(--prose-invert-hr))',
              quotes: 'hsl(var(--prose-invert-quotes))',
              'quote-borders': 'hsl(var(--prose-invert-quote-borders))',
              captions: 'hsl(var(--prose-invert-captions))',
              code: 'hsl(var(--prose-invert-code))',
              'pre-code': 'hsl(var(--prose-invert-pre-code))',
              'pre-bg': 'hsl(var(--prose-invert-pre-bg))',
              'th-borders': 'hsl(var(--prose-invert-th-borders))',
              'td-borders': 'hsl(var(--prose-invert-td-borders))',
            },
          },
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
       // Configure typography plugin
       typography: (theme: (arg0: string) => any) => ({
         DEFAULT: {
           css: {
             '--tw-prose-body': theme('colors.prose.body'),
             '--tw-prose-headings': theme('colors.prose.headings'),
             '--tw-prose-lead': theme('colors.prose.lead'),
             '--tw-prose-links': theme('colors.prose.links'),
             '--tw-prose-bold': theme('colors.prose.bold'),
             '--tw-prose-counters': theme('colors.prose.counters'),
             '--tw-prose-bullets': theme('colors.prose.bullets'),
             '--tw-prose-hr': theme('colors.prose.hr'),
             '--tw-prose-quotes': theme('colors.prose.quotes'),
             '--tw-prose-quote-borders': theme('colors.prose.quote-borders'),
             '--tw-prose-captions': theme('colors.prose.captions'),
             '--tw-prose-code': theme('colors.prose.code'),
             '--tw-prose-pre-code': theme('colors.prose.pre-code'),
             '--tw-prose-pre-bg': theme('colors.prose.pre-bg'),
             '--tw-prose-th-borders': theme('colors.prose.th-borders'),
             '--tw-prose-td-borders': theme('colors.prose.td-borders'),
             '--tw-prose-invert-body': theme('colors.prose.invert.body'),
             '--tw-prose-invert-headings': theme('colors.prose.invert.headings'),
             '--tw-prose-invert-lead': theme('colors.prose.invert.lead'),
             '--tw-prose-invert-links': theme('colors.prose.invert.links'),
             '--tw-prose-invert-bold': theme('colors.prose.invert.bold'),
             '--tw-prose-invert-counters': theme('colors.prose.invert.counters'),
             '--tw-prose-invert-bullets': theme('colors.prose.invert.bullets'),
             '--tw-prose-invert-hr': theme('colors.prose.invert.hr'),
             '--tw-prose-invert-quotes': theme('colors.prose.invert.quotes'),
             '--tw-prose-invert-quote-borders': theme('colors.prose.invert.quote-borders'),
             '--tw-prose-invert-captions': theme('colors.prose.invert.captions'),
             '--tw-prose-invert-code': theme('colors.prose.invert.code'),
             '--tw-prose-invert-pre-code': theme('colors.prose.invert.pre-code'),
             '--tw-prose-invert-pre-bg': theme('colors.prose.invert.pre-bg'),
             '--tw-prose-invert-th-borders': theme('colors.prose.invert.th-borders'),
             '--tw-prose-invert-td-borders': theme('colors.prose.invert.td-borders'),
             // Base font size
             fontSize: '0.875rem', // 14px, matching textarea/input sm
             lineHeight: '1.5',
             // Code block specific styles
             'pre': {
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
                padding: theme('spacing.4'),
                borderRadius: theme('borderRadius.md'),
                marginTop: theme('spacing.4'),
                marginBottom: theme('spacing.4'),
              },
             'code::before': { content: '""' }, // Remove backticks from inline code
             'code::after': { content: '""' },
             'code': {
                fontWeight: '500',
                fontSize: '0.875em', // Slightly smaller than base
                padding: '0.2em 0.4em',
                borderRadius: theme('borderRadius.sm'),
             },
             'pre code': {
                padding: '0',
                fontSize: 'inherit', // Inherit from pre
                fontWeight: 'inherit',
                backgroundColor: 'transparent',
                borderRadius: '0',
                borderWidth: '0',
             },
           },
         },
       }),
  	}
  },
  plugins: [
      require("tailwindcss-animate"),
      require('@tailwindcss/typography'), // Add typography plugin
    ],
} satisfies Config;
