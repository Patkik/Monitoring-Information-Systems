# Code Citations

## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/SanjaySargam/opencollectiveandroid/blob/688d8ff42572cb4bb9f0f27c8d58e1b432f4fb63/components/ThemeProvider.tsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync
```


## License: unknown
https://github.com/Daniel-Slattery/danielslattery.dev/blob/e55a2cbb5009f36eb47f62c7c795e1a7845e4301/components/ThemeToggleButton.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync with backend
    fetch('/api/users
```


## License: unknown
https://github.com/ImArnoldDCODES/WA/blob/ad436117d28c1323a3fadac535c075aa1b8ea3f4/src/App.js

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync with backend
    fetch('/api/users
```


## License: unknown
https://github.com/fuegobscuro/mongo-HelloWorld/blob/27a23d2c537a526133003102dbd5328d4ae75670/client/src/components/ThemeContext.jsx

```
Now I'll provide you with a detailed analysis and implementation roadmap:

## **MERN Refactor Analysis & Implementation Roadmap**

Based on your design document and current codebase (React + Tailwind, Node/Express, MongoDB), here's the comprehensive breakdown:

---

## **PHASE 1: Design System Foundation** (Weeks 1-2)

### **1.1 - Setup CSS Variable System (Priority: CRITICAL)**

Create [frontend/src/styles/theme.css](not created yet):
```css
/* Light mode (default) */
:root {
  /* Primary Purple Scale (HSL: 265, 85%) */
  --color-primary-50: hsl(265, 85%, 96%);
  --color-primary-100: hsl(265, 85%, 90%);
  --color-primary-300: hsl(265, 85%, 75%);
  --color-primary-500: hsl(265, 85%, 45%); /* Brand core */
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-900: hsl(265, 85%, 15%);
  
  /* Cool Neutral Grays (tinted with primary hue) */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f9f7fb;
  --color-neutral-100: #f3f0f7;
  --color-neutral-200: #e8e3f0;
  --color-neutral-300: #d4cbe0;
  --color-neutral-600: #4a4559;
  --color-neutral-900: #1a1820;
  
  /* Semantic colors */
  --surface-background: var(--color-neutral-0);
  --surface-secondary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --border-color: var(--color-neutral-200);
  
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme='dark'] {
  --surface-background: #121215;
  --surface-secondary: #1e1b22;
  --text-primary: #ffffff;
  --text-secondary: #b9b4c4;
  --border-color: #2a2631;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
}
```

### **1.2 - Create Theme Context Provider**

Create [frontend/src/shared/context/ThemeContext.tsx](not created yet):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check user preference from localStorage
    const stored = localStorage.getItem('theme');
    const preferred = stored as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Sync with backend
    fetch('/api/users
```

