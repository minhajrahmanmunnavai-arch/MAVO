
import { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../components/contex/AdminContext.jsx';
import { uploadProduct } from '../services/productupload.api.js';

export const useProductForm = ({ initialProduct = null, isEdit = false }) => {

    const context = useContext(AdminContext);

    const {
        categories,
        addProduct,
        navigateTo,
        addToast,
        product,
        setProduct,
        loading,
        setLoading
    } = context;

    // ==============================
    // Product Upload Handler
    // ==============================

    const handleUploadProduct = async ({title, sku, brand, category, shopName, productName, description, specifications, pricing, mainImage, galleryImages, slug, metaTitle, metaDescription}) => {
        setLoading(true);

        try {
            const data = await uploadProduct({title, sku, brand, category, shopName, productName, description, specifications, pricing, mainImage, galleryImages, slug, metaTitle, metaDescription});

            if (!data || !data.product) {
                throw new Error('Product upload failed.');
            }

            setProduct(data.product);

            return data.product;

        } catch (error) {
            throw error;

        } finally {
            setLoading(false);
        }
    };

    // ==============================
    // Form States
    // ==============================

    const [name, setName] = useState(initialProduct?.name || '');
    const [slug, setSlug] = useState(initialProduct?.slug || '');
    const [sku, setSku] = useState(initialProduct?.sku || '');
    const [brand, setBrand] = useState(initialProduct?.brand || '');

    const [category, setCategory] = useState(
        initialProduct?.category || categories[0]?.name || 'Audio & Electronics'
    );

    const [subcategory, setSubcategory] = useState(
        initialProduct?.subcategory || 'General'
    );

    // Pricing
    const [price, setPrice] = useState(
        initialProduct?.price?.toString() || ''
    );

    const [salePrice, setSalePrice] = useState(
        initialProduct?.salePrice?.toString() || ''
    );

    const [taxRate, setTaxRate] = useState('8.5');

    // Inventory
    const [stock, setStock] = useState(
        initialProduct?.stock?.toString() || '50'
    );

    const [lowStockThreshold, setLowStockThreshold] = useState(
        initialProduct?.lowStockThreshold?.toString() || '10'
    );

    // Images
    const [mainImage, setMainImage] = useState(
        initialProduct?.image ||
        '/src/assets/images/product_wireless_headphones_1790955010161.jpg'
    );

    const [galleryImages, setGalleryImages] = useState(
        initialProduct?.gallery || [
            '/src/assets/images/product_smart_watch_1790955024311.jpg',
            '/src/assets/images/product_leather_wallet_1790955035510.jpg'
        ]
    );

    // Description
    const [description, setDescription] = useState(
        initialProduct?.description ||
        'Engineered with aerospace-grade materials, precision-tuned acoustic components, and designed for day-long ergonomics.'
    );

    // Specifications
    const [specifications, setSpecifications] = useState(
        initialProduct?.specifications || [
            {
                name: 'Chassis Material',
                value: 'Anodized Aircraft Aluminum'
            },
            {
                name: 'Warranty',
                value: '2-Year International Manufacturer Coverage'
            }
        ]
    );

    // Shipping
    const [weight, setWeight] = useState('0.85');

    const [dimensions, setDimensions] = useState({
        length: '22',
        width: '18',
        height: '8'
    });

    const [shippingClass, setShippingClass] = useState('Standard Priority');

    // SEO
    const [metaTitle, setMetaTitle] = useState(
        initialProduct?.metaTitle || ''
    );

    const [metaDescription, setMetaDescription] = useState(
        initialProduct?.metaDescription ||
        'Shop the premium handcrafted MOX merchandise collection with expedited carbon-neutral shipping.'
    );

    // Validation
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==============================
    // Slug Generation
    // ==============================

    useEffect(() => {
        if (!isEdit && name) {
            setSlug(
                name
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
            );
        }
    }, [name, isEdit]);

    // ==============================
    // Specification Handlers
    // ==============================

    const handleAddSpecification = () => {
        setSpecifications(prev => [
            ...prev,
            { name: '', value: '' }
        ]);
    };

    const handleUpdateSpec = (idx, field, val) => {
        setSpecifications(prev =>
            prev.map((spec, index) =>
                index === idx
                    ? { ...spec, [field]: val }
                    : spec
            )
        );
    };

    const handleRemoveSpec = (idx) => {
        setSpecifications(prev =>
            prev.filter((_, index) => index !== idx)
        );
    };

    // ==============================
    // Image Handlers
    // ==============================

    const handleAddSampleImage = () => {
        const samples = [
            '/src/assets/images/product_wireless_headphones_1790955010161.jpg',
            '/src/assets/images/product_smart_watch_1790955024311.jpg',
            '/src/assets/images/product_leather_wallet_1790955035510.jpg'
        ];

        const randomImg = samples[
            Math.floor(Math.random() * samples.length)
        ];

        if (galleryImages.length < 6) {
            setGalleryImages(prev => [...prev, randomImg]);

            addToast({
                title: 'Image Added',
                message: 'Gallery slot updated.',
                type: 'info'
            });
        } else {
            addToast({
                title: 'Limit Reached',
                message: 'Maximum 6 gallery images allowed.',
                type: 'warning'
            });
        }
    };

    const handleRemoveGalleryImage = (idx) => {
        setGalleryImages(prev =>
            prev.filter((_, index) => index !== idx)
        );
    };

    // ==============================
    // Form Validation
    // ==============================

    const validateForm = () => {
        const errs = {};

        if (!name.trim()) {
            errs.name = 'Product name is required';
        }

        if (!sku.trim()) {
            errs.sku = 'SKU identifier is required';
        }

        if (!category.trim()) {
            errs.category = 'Category is required';
        }

        if (
            !price ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0
        ) {
            errs.price = 'Valid regular price is required';
        }

        if (
            salePrice &&
            (
                !Number.isFinite(Number(salePrice)) ||
                Number(salePrice) < 0 ||
                Number(salePrice) > Number(price)
            )
        ) {
            errs.salePrice = 'Sale price must be valid and cannot exceed regular price';
        }

        if (
            stock === '' ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            errs.stock = 'Valid stock quantity is required';
        }

        setErrors(errs);

        return Object.keys(errs).length === 0;
    };

    // ==============================
    // Form Submit Handler
    // ==============================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!validateForm()) {
            addToast({
                title: 'Validation Failed',
                message: 'Please resolve errors highlighted in the form.',
                type: 'danger'
            });

            return;
        }

        setIsSubmitting(true);

        try {

            if (isEdit) {
                throw new Error('Product update API has not been created yet.');
            }

            const payload = {
                title: name.trim(),
                sku: sku.trim(),
                brand: brand.trim(),
                category: category.trim(),
                subcategory: subcategory.trim(),

                shopName: '',
                productName: name.trim(),

                description,

                specifications: specifications.filter(
                    spec => spec.name.trim() && spec.value.trim()
                ),

                pricing: {
                    regularPrice: Number(price),
                    salePrice: salePrice ? Number(salePrice) : null,
                    taxRate: Number(taxRate)
                },

                inventory: {
                    stock: Number(stock),
                    lowStockThreshold: Number(lowStockThreshold)
                },

                shipping: {
                    weight: Number(weight),
                    dimensions: {
                        length: Number(dimensions.length),
                        width: Number(dimensions.width),
                        height: Number(dimensions.height)
                    },
                    shippingClass
                },

                mainImage,
                galleryImages,

                slug: slug.trim().toLowerCase(),

                metaTitle,
                metaDescription,

                status: 'published'
            };

            const uploadedProduct = await handleUploadProduct(payload);

            addProduct(uploadedProduct);

            addToast({
                title: 'Product Created',
                message: 'Product uploaded successfully.',
                type: 'success'
            });

            navigateTo('products');

        } catch (error) {

            addToast({
                title: 'Upload Failed',
                message: error.response?.data?.message || error.message || 'Something went wrong.',
                type: 'danger'
            });

            throw error;

        } finally {
            setIsSubmitting(false);
        }
    };

    // ==============================
    // Return
    // ==============================

    return {

        // Product Upload
        product,
        loading,
        handleUploadProduct,

        // Admin
        categories,
        navigateTo,

        // Basic Information
        name,
        setName,
        slug,
        setSlug,
        sku,
        setSku,
        brand,
        setBrand,
        category,
        setCategory,
        subcategory,
        setSubcategory,

        // Pricing
        price,
        setPrice,
        salePrice,
        setSalePrice,
        taxRate,
        setTaxRate,

        // Inventory
        stock,
        setStock,
        lowStockThreshold,
        setLowStockThreshold,

        // Images
        mainImage,
        setMainImage,
        galleryImages,
        handleAddSampleImage,
        handleRemoveGalleryImage,

        // Description
        description,
        setDescription,

        // Specifications
        specifications,
        handleAddSpecification,
        handleUpdateSpec,
        handleRemoveSpec,

        // Shipping
        weight,
        setWeight,
        dimensions,
        setDimensions,
        shippingClass,
        setShippingClass,

        // SEO
        metaTitle,
        setMetaTitle,
        metaDescription,
        setMetaDescription,

        // Validation
        errors,

        // Submission
        isSubmitting,
        handleSubmit
    };
};
