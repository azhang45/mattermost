// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {mockXHR} from 'tests/mock_xhr';
import {act, renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import FileAttachment from './file_attachment';

describe('FileAttachment', () => {
    const baseFileInfo = {
        id: 'thumbnail_id',
        extension: 'pdf',
        name: 'test.pdf',
        size: 100,
        width: 100,
        height: 80,
        has_preview_image: true,
        user_id: '',
        channel_id: 'channel_id',
        create_at: 0,
        update_at: 0,
        delete_at: 0,
        mime_type: '',
        clientId: '',
    };

    const baseProps = {
        fileInfo: baseFileInfo,
        handleImageClick: jest.fn(),
        index: 3,
        canDownloadFiles: true,
        enableSVGs: false,
        enablePublicLink: false,
        pluginMenuItems: [],
        currentChannel: TestHelper.getChannelMock(),
        isFileRejected: false,
        handleFileDropdownOpened: jest.fn(() => null),
        actions: {
            openModal: jest.fn(),
        },
    };

    test('should blur file attachment link after click', async () => {
        const props = {...baseProps, compactDisplay: true};
        renderWithContext(<FileAttachment {...props}/>);

        const link = screen.getByText(baseProps.fileInfo.name);
        const blur = jest.spyOn(link, 'blur');
        await userEvent.click(link);
        expect(blur).toHaveBeenCalled();
    });

    test('shows a generic icon after one missing thumbnail request', async () => {
        const network = mockXHR();
        const handleImageClick = jest.fn();
        const props = {...baseProps, handleImageClick, fileInfo: {...baseFileInfo, extension: 'png', name: 'picture.png'}};
        const thumbnailPath = '/api/v4/files/thumbnail_id/thumbnail';
        try {
            renderWithContext(<FileAttachment {...props}/>);

            act(() => network.respond(thumbnailPath, 404));
            const link = screen.getByRole('link', {name: 'file thumbnail picture.png'});
            expect(link.querySelector('.file-icon.generic')).toBeInTheDocument();
            await userEvent.click(link);
            expect(handleImageClick).toHaveBeenCalledWith(props.index);
            expect(network.requests.map(({path}) => path)).toEqual([thumbnailPath]);
        } finally {
            network.restore();
        }
    });

    test('continues to render an animated GIF from the original when it has no generated preview', () => {
        const network = mockXHR();
        const fileInfo = {...baseFileInfo, extension: 'gif', name: 'animation.gif', has_preview_image: false};
        const originalPath = '/api/v4/files/thumbnail_id';
        try {
            renderWithContext(
                <FileAttachment
                    {...baseProps}
                    fileInfo={fileInfo}
                />,
            );
            act(() => network.respond(originalPath, 200));

            const link = screen.getByRole('link', {name: 'file thumbnail animation.gif'});
            expect(link.querySelector<HTMLElement>('.post-image')?.style.backgroundImage).toContain(originalPath);
            expect(link.querySelector('.file-icon.generic')).not.toBeInTheDocument();
            expect(network.requests.map(({path}) => path)).toEqual([originalPath]);
        } finally {
            network.restore();
        }
    });
});
