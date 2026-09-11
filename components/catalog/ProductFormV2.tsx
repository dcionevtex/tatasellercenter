"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2, ImageIcon, Plus, X, ChevronRight } from "lucide-react";
import { createProductV2Action } from "@/lib/actions/catalog";
import type { CreateProductV2State } from "@/lib/actions/catalog";
import type { VtexCategory, VtexBrand } from "@/lib/types/catalog";
import { CategoryPicker } from "@/components/catalog/CategoryPicker";

interface ProductFormV2Props {
  categories: VtexCategory[];
  brands: VtexBrand[];
}

interface AttributeRow {
  key: string;
  name: string;
  value: string;
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition disabled:opacity-50";

/**
 * "Catalog V2" product registration — mirrors VTEX's own Seller Portal admin
 * screen, backed by a single POST to /api/catalog-seller-portal/products (see
 * createSellerProduct / createProductV2Action).
 *
 * Two deliberate departures from that endpoint's full capability, both scoped
 * to what this flow actually needs:
 * - Images are a plain URL field, not a real upload — vtex.catalog-images is
 *   blocked on this account's App Key (see docs/vtex-gotchas.md). This is a
 *   mock for the broken upload permission, not a bypass of VTEX's own
 *   validation: confirmed live that VTEX rejects any URL not already hosted on
 *   `{account}.vtexassets.com`, on create just like on the PUT path, so the
 *   field only ever accepts that format (validated in createProductV2Action).
 * - Single SKU only. The endpoint can create multiple SKUs with specs in one
 *   call, but variation-matrix generation is a separate feature this form
 *   doesn't attempt.
 *
 * Price and stock are intentionally NOT set here — they're added on the
 * product detail page once the SKU exists.
 */
export function ProductFormV2({ categories, brands }: ProductFormV2Props) {
  const [state, formAction, isPending] = useActionState<CreateProductV2State, FormData>(
    createProductV2Action,
    {}
  );
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);

  const activeBrands = brands.filter((b) => b.isActive);
  const vtexAssetsPrefix = `https://${process.env.NEXT_PUBLIC_VTEX_SELLER_ACCOUNT ?? ""}.vtexassets.com/`;

  function addAttribute() {
    setAttributes((rows) => [...rows, { key: crypto.randomUUID(), name: "", value: "" }]);
  }

  function updateAttribute(key: string, field: "name" | "value", value: string) {
    setAttributes((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function removeAttribute(key: string) {
    setAttributes((rows) => rows.filter((r) => r.key !== key));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="attributes" value={JSON.stringify(attributes)} />

      {/* Error banner */}
      {state.error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {categories.length === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            No categories found in your catalog. Create at least one in VTEX Admin before
            adding products.
          </p>
        </div>
      )}

      {/* Header: thumbnail + title + active toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-zinc-300 shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900">New product</h2>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm text-zinc-600">Active</span>
          <input
            type="checkbox"
            name="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="peer sr-only"
          />
          <span
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isActive ? "bg-primary" : "bg-zinc-300"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </span>
        </label>
      </div>

      {/* Basic information */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900">Basic information</h3>
        <p className="text-xs text-zinc-500 mt-0.5 mb-4">
          Information needed to start selling your product.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Name" htmlFor="productName" required>
              <input
                id="productName"
                name="productName"
                required
                placeholder="e.g. Premium Running Shoes"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Brand" htmlFor="brandId" required>
            <select
              id="brandId"
              name="brandId"
              required
              disabled={activeBrands.length === 0}
              className={inputClass}
            >
              <option value="">Select a brand…</option>
              {activeBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" required>
            <CategoryPicker
              categories={categories}
              name="categoryId"
              required
              disabled={categories.length === 0}
            />
          </Field>
          <Field label="Reference code" htmlFor="refId">
            <input id="refId" name="refId" placeholder="e.g. SHOE-001" className={inputClass} />
          </Field>
        </div>
      </section>

      {/* Operations and logistics */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900">Operations and logistics</h3>
        <p className="text-xs text-zinc-500 mt-0.5 mb-4">
          Logistics settings connected with the product.
        </p>
        <Field label="Tax code" htmlFor="taxCode">
          <input id="taxCode" name="taxCode" placeholder="e.g. 123" className={inputClass} />
        </Field>
      </section>

      {/* Description */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900">Description</h3>
        <p className="text-xs text-zinc-500 mt-0.5 mb-4">Summary of the main product features.</p>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Product description…"
          className={`${inputClass} resize-none`}
        />
      </section>

      {/* Images */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900">Images</h3>
        <p className="text-xs text-zinc-500 mt-0.5 mb-4">
          This account's real image upload is blocked pending a VTEX permission (see
          vtex.catalog-images in License Manager), so this is a URL-only mock rather than a
          file upload — and VTEX only accepts a URL already hosted on{" "}
          <code className="text-zinc-600">{vtexAssetsPrefix}</code>, even at creation. Upload
          the image once through VTEX Admin's catalog UI to get a URL in that format.
        </p>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder={`${vtexAssetsPrefix}…`}
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImageError(false);
            }}
            className={inputClass}
          />
          {imageUrl && !imageUrl.startsWith(vtexAssetsPrefix) && (
            <p className="text-xs text-amber-600 mt-2">
              VTEX will reject this — it isn't hosted on {vtexAssetsPrefix}
            </p>
          )}
          {imageUrl && (
            <div className="mt-3 flex items-center gap-3">
              {!imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Preview"
                  onError={() => setImageError(true)}
                  className="w-16 h-16 rounded-md border border-zinc-200 object-cover bg-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-md border border-zinc-200 bg-white flex items-center justify-center text-zinc-300">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <p className="text-xs text-zinc-400">
                {imageError ? "Could not load a preview — the URL will still be sent." : "Preview"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Attributes */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900">Attributes</h3>
        <p className="text-xs text-zinc-500 mt-0.5 mb-4">
          Additional information related to the product.
        </p>
        <div className="space-y-2">
          {attributes.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                placeholder="Name"
                value={row.name}
                onChange={(e) => updateAttribute(row.key, "name", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Value"
                value={row.value}
                onChange={(e) => updateAttribute(row.key, "value", e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeAttribute(row.key)}
                className="p-2 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                aria-label="Remove attribute"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAttribute}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </section>

      {/* SKU information */}
      <section className="bg-white rounded-lg border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900">SKU information</h3>
        <p className="text-xs text-zinc-500 mt-0.5 mb-4">
          Properties that define the product's SKU.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Reference code" htmlFor="skuRefId">
            <input
              id="skuRefId"
              name="skuRefId"
              placeholder="e.g. SHOE-001-42-BL"
              className={inputClass}
            />
          </Field>
          <Field label="EAN/UPC" htmlFor="ean">
            <input id="ean" name="ean" placeholder="e.g. 978-1909621862" className={inputClass} />
          </Field>
        </div>
        <p className="text-xs font-medium text-zinc-700 mb-2">Package dimensions</p>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Weight (kg)" htmlFor="weightKg" required>
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.001"
              min="0"
              defaultValue="0.5"
              required
              className={inputClass}
            />
          </Field>
          <Field label="Width (cm)" htmlFor="width" required>
            <input
              id="width"
              name="width"
              type="number"
              step="0.1"
              min="0"
              defaultValue="10"
              required
              className={inputClass}
            />
          </Field>
          <Field label="Height (cm)" htmlFor="height" required>
            <input
              id="height"
              name="height"
              type="number"
              step="0.1"
              min="0"
              defaultValue="10"
              required
              className={inputClass}
            />
          </Field>
          <Field label="Length (cm)" htmlFor="length" required>
            <input
              id="length"
              name="length"
              type="number"
              step="0.1"
              min="0"
              defaultValue="10"
              required
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <a
          href="/catalog"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending || categories.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating…
            </>
          ) : (
            <>
              Create Product
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
