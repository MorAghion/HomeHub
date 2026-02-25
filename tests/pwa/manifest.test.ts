/**
 * qa-013: PWA manifest + meta tag + vite config tests
 *
 * TDD phase — these tests WILL FAIL until be-002 is merged.
 * Once be-002 lands on master, pull and re-run: all should pass.
 *
 * Test coverage:
 *   - public/manifest.json: existence, required fields, icon entries
 *   - Icon files: 192px and 512px actually exist at declared paths
 *   - index.html: manifest link + iOS meta tags
 *   - vite.config.ts: references VitePWA plugin
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.resolve(process.cwd())
const MANIFEST_PATH = path.join(ROOT, 'public', 'manifest.json')
const INDEX_HTML_PATH = path.join(ROOT, 'index.html')
const VITE_CONFIG_PATH = path.join(ROOT, 'vite.config.ts')

// ---------------------------------------------------------------------------
// manifest.json
// ---------------------------------------------------------------------------
describe('public/manifest.json', () => {
  it('exists', () => {
    expect(fs.existsSync(MANIFEST_PATH), `manifest.json not found at ${MANIFEST_PATH}`).toBe(true)
  })

  describe('fields', () => {
    // Parse lazily so other tests still run even if the file is missing
    const getManifest = (): Record<string, unknown> => {
      const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8')
      return JSON.parse(raw) as Record<string, unknown>
    }

    it('name === "HomeHub"', () => {
      expect(getManifest().name).toBe('HomeHub')
    })

    it('theme_color === "#630606"', () => {
      expect(getManifest().theme_color).toBe('#630606')
    })

    it('background_color === "#F5F2E7"', () => {
      expect(getManifest().background_color).toBe('#F5F2E7')
    })

    it('display === "standalone"', () => {
      expect(getManifest().display).toBe('standalone')
    })

    it('icons array is present and non-empty', () => {
      const manifest = getManifest()
      expect(Array.isArray(manifest.icons)).toBe(true)
      expect((manifest.icons as unknown[]).length).toBeGreaterThan(0)
    })

    it('icons includes a 192px entry', () => {
      const manifest = getManifest()
      const icons = manifest.icons as Array<{ sizes: string; src: string }>
      const has192 = icons.some(icon => icon.sizes && icon.sizes.includes('192x192'))
      expect(has192, 'No 192x192 icon found in manifest').toBe(true)
    })

    it('icons includes a 512px entry', () => {
      const manifest = getManifest()
      const icons = manifest.icons as Array<{ sizes: string; src: string }>
      const has512 = icons.some(icon => icon.sizes && icon.sizes.includes('512x512'))
      expect(has512, 'No 512x512 icon found in manifest').toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Icon files exist at the paths declared in manifest
  // ---------------------------------------------------------------------------
  describe('icon files existence', () => {
    const getIcons = (): Array<{ src: string; sizes: string }> => {
      const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8')
      const manifest = JSON.parse(raw) as { icons: Array<{ src: string; sizes: string }> }
      return manifest.icons
    }

    it('192px icon file exists at the path specified in manifest', () => {
      const icons = getIcons()
      const icon192 = icons.find(i => i.sizes && i.sizes.includes('192x192'))
      expect(icon192, 'No 192x192 icon entry in manifest').toBeDefined()
      const iconPath = path.join(ROOT, 'public', icon192!.src.replace(/^\//, ''))
      expect(
        fs.existsSync(iconPath),
        `192px icon file not found at ${iconPath}`,
      ).toBe(true)
    })

    it('512px icon file exists at the path specified in manifest', () => {
      const icons = getIcons()
      const icon512 = icons.find(i => i.sizes && i.sizes.includes('512x512'))
      expect(icon512, 'No 512x512 icon entry in manifest').toBeDefined()
      const iconPath = path.join(ROOT, 'public', icon512!.src.replace(/^\//, ''))
      expect(
        fs.existsSync(iconPath),
        `512px icon file not found at ${iconPath}`,
      ).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// index.html meta tags
// ---------------------------------------------------------------------------
describe('index.html PWA meta tags', () => {
  const getHtml = (): string => fs.readFileSync(INDEX_HTML_PATH, 'utf-8')

  it('contains <link rel="manifest">', () => {
    expect(getHtml()).toMatch(/rel=["']manifest["']/)
  })

  it('contains apple-mobile-web-app-capable meta tag', () => {
    expect(getHtml()).toMatch(/apple-mobile-web-app-capable/)
  })

  it('contains apple-mobile-web-app-status-bar-style meta tag', () => {
    expect(getHtml()).toMatch(/apple-mobile-web-app-status-bar-style/)
  })

  it('contains apple-mobile-web-app-title meta tag', () => {
    expect(getHtml()).toMatch(/apple-mobile-web-app-title/)
  })
})

// ---------------------------------------------------------------------------
// vite.config.ts
// ---------------------------------------------------------------------------
describe('vite.config.ts', () => {
  const getConfig = (): string => fs.readFileSync(VITE_CONFIG_PATH, 'utf-8')

  it('imports or references vite-plugin-pwa', () => {
    expect(getConfig()).toMatch(/vite-plugin-pwa/)
  })

  it('VitePWA plugin is included in the plugins array', () => {
    expect(getConfig()).toMatch(/VitePWA\s*\(/)
  })
})
