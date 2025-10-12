// services/exporters/acf.ts
import type { AcfExport } from '../../types';

/**
 * Builds a static JSON object representing an ACF Flexible Content field group stub.
 * This structure is based on the user's decisions and is intended to be used
 * for setting up the required fields in WordPress.
 * @returns An AcfExport object ready to be stringified.
 */
export const buildAcfJson = (): AcfExport => {
    return {
        field_groups: [
            {
                key: 'group_dkip_page',
                title: 'dKip Page Content',
                fields: [
                    {
                        key: 'field_dkip_sections',
                        label: 'Sections',
                        name: 'dkip_sections',
                        type: 'flexible_content',
                        instructions: 'Add and order content sections for this page.',
                        required: 0,
                        conditional_logic: 0,
                        wrapper: { width: '', class: '', id: '' },
                        layouts: [
                            // Hero Layout
                            {
                                key: 'layout_dkip_hero', name: 'dkip_hero', label: 'Hero', display: 'block',
                                sub_fields: [
                                    { key: 'field_dkip_hero_title', label: 'Title', name: 'title', type: 'text' },
                                    { key: 'field_dkip_hero_subtitle', label: 'Subtitle', name: 'subtitle', type: 'text' },
                                    { key: 'field_dkip_hero_media_url', label: 'Media URL', name: 'media_url', type: 'url' },
                                ],
                                min: '0', max: '1',
                            },
                            // Accordion Layout
                            {
                                key: 'layout_dkip_accordion', name: 'dkip_accordion', label: 'Accordion', display: 'block',
                                sub_fields: [
                                    {
                                        key: 'field_dkip_accordion_items', label: 'Items', name: 'items', type: 'repeater',
                                        sub_fields: [
                                            { key: 'field_dkip_accordion_item_title', label: 'Title', name: 'title', type: 'text' },
                                            { key: 'field_dkip_accordion_item_content', label: 'Content', name: 'content', type: 'wysiwyg' },
                                        ]
                                    }
                                ],
                                min: '', max: '',
                            },
                            // FAQ Layout
                            {
                                key: 'layout_dkip_faq', name: 'dkip_faq', label: 'FAQ', display: 'block',
                                sub_fields: [
                                    {
                                        key: 'field_dkip_faq_items', label: 'FAQs', name: 'faqs', type: 'repeater',
                                        sub_fields: [
                                            { key: 'field_dkip_faq_item_q', label: 'Question', name: 'question', type: 'text' },
                                            { key: 'field_dkip_faq_item_a', label: 'Answer', name: 'answer', type: 'textarea' },
                                        ]
                                    }
                                ],
                                min: '', max: '',
                            },
                            // HTML Layout
                            {
                                key: 'layout_dkip_html', name: 'dkip_html', label: 'HTML', display: 'block',
                                sub_fields: [
                                    { key: 'field_dkip_html_content', label: 'HTML Content', name: 'html', type: 'wysiwyg', tabs: 'text', toolbar: 'basic' },
                                ],
                                min: '', max: '',
                            },
                             // Media Layout
                            {
                                key: 'layout_dkip_media', name: 'dkip_media', label: 'Media', display: 'block',
                                sub_fields: [
                                    { key: 'field_dkip_media_url', label: 'Media URL', name: 'url', type: 'url' },
                                    { key: 'field_dkip_media_alt', label: 'Alt Text', name: 'alt', type: 'text' },
                                ],
                                min: '', max: '',
                            },
                            // Downloads Layout
                            {
                                key: 'layout_dkip_downloads', name: 'dkip_downloads', label: 'Downloads', display: 'block',
                                sub_fields: [
                                    {
                                        key: 'field_dkip_downloads_files', label: 'Files', name: 'files', type: 'repeater',
                                        sub_fields: [
                                            { key: 'field_dkip_downloads_file_label', label: 'Label', name: 'label', type: 'text' },
                                            { key: 'field_dkip_downloads_file_url', label: 'URL', name: 'url', type: 'url' },
                                        ]
                                    }
                                ],
                                min: '', max: '',
                            },
                        ],
                        button_label: 'Add Section',
                        min: '',
                        max: '',
                    },
                ],
                location: [[{ param: 'post_type', operator: '==', value: 'page' }]],
                menu_order: 0,
                position: 'normal',
                style: 'default',
                label_placement: 'top',
                instruction_placement: 'label',
                hide_on_screen: [],
                active: true,
                description: 'Manages the modular content blocks for a dKip-powered page.',
            },
        ],
    };
};
