import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react'

export const ImageUpload = ({
  onFileSelect,
  label = 'Select Image',
  accept = 'image/jpeg,image/png,image/jpg',
  maxSizeMB = 10,
  className = ''
}) => {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    setError('')
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, JPEG, and PNG images are allowed.')
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum limit of ${maxSizeMB}MB.`)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setPreview(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onFileSelect) {
      onFileSelect(null)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/60"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0])
            }
          }}
        />

        {preview ? (
          <div className="relative w-full max-h-48 flex justify-center items-center">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 rounded-lg object-contain border border-slate-800"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-slate-900/80 hover:bg-rose-900 text-slate-300 hover:text-rose-200 rounded-full transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <UploadCloud className="w-9 h-9 text-slate-400 mb-2" />
            <p className="text-xs font-medium text-slate-200">{label}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Drag & drop or click to browse (Max {maxSizeMB}MB: JPG, PNG)
            </p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  )
}

export default ImageUpload

