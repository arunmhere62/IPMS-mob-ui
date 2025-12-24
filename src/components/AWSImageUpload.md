# AWS Image Upload Component

A React Native component for uploading images and documents to AWS S3 with a modern, user-friendly interface.

## Features

- ✅ **AWS S3 Integration**: Direct upload to AWS S3 via backend API
- ✅ **Multiple File Support**: Upload multiple images/documents at once
- ✅ **Camera & Gallery**: Take photos or choose from gallery
- ✅ **File Validation**: Automatic file type and size validation
- ✅ **Progress Indicators**: Real-time upload progress feedback
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Responsive Design**: Modern UI with proper spacing and shadows
- ✅ **TypeScript Support**: Full TypeScript support with proper types

## Installation

The component uses the following dependencies (already included in the project):
- `expo-image-picker` - For camera and gallery access
- `@expo/vector-icons` - For icons
- AWS S3 service integration via `awsS3ServiceBackend`

## Basic Usage

```tsx
import { ImageUploadS3 } from '../components/ImageUploadS3';

const MyComponent = () => {
  const [images, setImages] = useState<string[]>([]);

  return (
    <ImageUploadS3
      images={images}
      onImagesChange={setImages}
      maxImages={5}
      label="Images"
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | `[]` | Array of image URLs (S3 URLs) |
| `onImagesChange` | `(images: string[]) => void` | - | Callback when images change |
| `maxImages` | `number` | `5` | Maximum number of images allowed |
| `label` | `string` | `"Images"` | Label displayed above the component |
| `disabled` | `boolean` | `false` | Whether the component is disabled |
| `folder` | `string` | - | S3 folder path (optional) |
| `category` | `'image' \| 'document'` | `'image'` | File category for validation |
| `filePrefix` | `string` | `'tenant'` | Prefix for uploaded filenames |

## Advanced Usage

### Tenant Images
```tsx
<ImageUploadS3
  images={tenantImages}
  onImagesChange={setTenantImages}
  maxImages={5}
  label="Tenant Photos"
  folder="tenants/images"
  category="image"
  filePrefix="tenant"
/>
```

### Document Upload
```tsx
<ImageUploadS3
  images={documents}
  onImagesChange={setDocuments}
  maxImages={3}
  label="ID Proof Documents"
  folder="tenants/documents"
  category="document"
  filePrefix="proof"
/>
```

### Room Images
```tsx
<ImageUploadS3
  images={roomImages}
  onImagesChange={setRoomImages}
  maxImages={10}
  label="Room Photos"
  folder="rooms/images"
  category="image"
  filePrefix="room"
/>
```

## S3 Folder Structure

The component automatically organizes files in S3 using the following structure:

```
bucket-name/
├── tenants/
│   ├── images/
│   │   └── tenant_filename_timestamp_random.jpg
│   └── documents/
│       └── proof_filename_timestamp_random.pdf
├── rooms/
│   └── images/
│       └── room_filename_timestamp_random.jpg
└── employees/
    ├── images/
    └── documents/
```

## File Validation

The component automatically validates:

### Image Files
- **Allowed types**: JPEG, JPG, PNG, GIF, WebP
- **Max size**: 10MB
- **Quality**: Automatically compressed to 80% quality

### Document Files
- **Allowed types**: PDF, DOC, DOCX
- **Max size**: 20MB

## Error Handling

The component handles various error scenarios:

- **Permission denied**: Requests camera/gallery permissions
- **File too large**: Shows size limit error
- **Invalid file type**: Shows supported formats
- **Upload failure**: Retries and shows error message
- **Network issues**: Handles offline scenarios

## UI Features

### Visual Feedback
- **Upload progress**: Shows spinner during upload
- **Image previews**: Displays uploaded images
- **Remove buttons**: Easy image removal with confirmation
- **Image numbering**: Shows image order badges

### Responsive Design
- **Horizontal scrolling**: For multiple images
- **Touch-friendly**: Large touch targets
- **Modern styling**: Rounded corners, shadows, proper spacing

## Backend Integration

The component integrates with your backend API through `awsS3ServiceBackend`:

### Required Backend Endpoints
- `POST /s3/upload` - Upload file to S3
- `DELETE /s3/delete` - Delete file from S3
- `DELETE /s3/delete-multiple` - Bulk delete files

### Upload Flow
1. User selects image from camera/gallery
2. Image is validated (type, size)
3. File is uploaded to S3 via backend API
4. S3 URL is returned and stored
5. UI updates with new image

### Delete Flow
1. User taps remove button
2. Confirmation dialog appears
3. File is deleted from S3 via backend API
4. Image is removed from local state

## Customization

### Styling
The component uses the app's theme system and can be customized by modifying the styles object:

```tsx
const customStyles = StyleSheet.create({
  container: {
    // Custom container styles
  },
  image: {
    width: 150,
    height: 150,
    // Custom image dimensions
  },
  // ... other style overrides
});
```

### Validation
Custom validation can be added by extending the AWS config:

```tsx
// In aws.config.ts
export const CUSTOM_LIMITS = {
  maxImageSizeMB: 5, // Reduce to 5MB
  allowedImageTypes: ['image/jpeg', 'image/png'], // Only JPEG and PNG
};
```

## Performance Considerations

- **Image compression**: Images are automatically compressed to reduce upload time
- **Parallel uploads**: Multiple images upload simultaneously
- **Memory management**: Large images are handled efficiently
- **Caching**: S3 URLs are cached for better performance

## Security

- **Secure uploads**: All uploads go through your backend API
- **File validation**: Server-side validation prevents malicious files
- **Access control**: S3 permissions managed by backend
- **URL signing**: Temporary signed URLs for secure access

## Troubleshooting

### Common Issues

1. **Upload fails**
   - Check internet connection
   - Verify AWS credentials in backend
   - Check S3 bucket permissions

2. **Images not displaying**
   - Verify S3 URLs are public
   - Check CORS settings on S3 bucket
   - Ensure proper image format

3. **Permission errors**
   - Grant camera/gallery permissions in device settings
   - Check app permissions in iOS/Android settings

### Debug Mode
Enable debug logging by setting:
```tsx
console.log('S3 upload debug:', { key, contentType, fileSize });
```

## Migration from Basic ImageUpload

To migrate from the basic `ImageUpload` component:

1. Replace import:
```tsx
// Old
import { ImageUpload } from '../components/ImageUpload';

// New
import { ImageUploadS3 } from '../components/ImageUploadS3';
```

2. Update component usage:
```tsx
// Old
<ImageUpload
  images={images}
  onImagesChange={setImages}
  maxImages={5}
  label="Images"
/>

// New
<ImageUploadS3
  images={images}
  onImagesChange={setImages}
  maxImages={5}
  label="Images"
/>
```

3. Update state handling:
```tsx
// Images are now S3 URLs instead of base64 strings
const [images, setImages] = useState<string[]>([]); // S3 URLs
```

## Best Practices

1. **Use descriptive folders**: Organize files logically in S3
2. **Set appropriate limits**: Don't allow unlimited uploads
3. **Handle errors gracefully**: Show user-friendly error messages
4. **Optimize images**: Use appropriate quality settings
5. **Clean up unused files**: Implement cleanup for deleted records
6. **Monitor usage**: Track S3 storage and bandwidth usage

## Examples in the App

The component is currently used in:

- **Tenant Creation**: `AddTenantScreen.tsx`
  - Tenant photos: `folder="tenants/images"`
  - ID documents: `folder="tenants/documents"`

- **Room Management**: `AddRoomScreen.tsx`
  - Room photos: `folder="rooms/images"`

- **Employee Management**: `AddEmployeeScreen.tsx`
  - Employee photos: `folder="employees/images"`
  - Employee documents: `folder="employees/documents"`
