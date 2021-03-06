import { dump as yamlDump, safeLoad as yamlLoad } from 'js-yaml';
import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Placeholder } from 'semantic-ui-react';

import FloatingIconButton from '../../common/FloatingIconButton';
import { ProjectContext } from '../../../layouts/context';
import BotResponseContainer from './BotResponseContainer';
import ExceptionWrapper from './ExceptionWrapper';

const BotResponsesContainer = (props) => {
    const {
        name,
        onDeleteAllResponses,
        deletable,
        exceptions,
        isNew,
        removeNewState,
        language,
        addNewResponse,
    } = props;
    const { getResponse, updateResponse } = useContext(ProjectContext);
    const [template, setTemplate] = useState(null);
    const [focus, setFocus] = useState(isNew ? 0 : null);

    const getSequence = () => {
        if (!template) return [];
        const response = template.values
            .find(({ lang }) => lang === language);
        if (!response) return [];
        const { sequence } = response;
        if (!sequence) return [];
        return sequence;
    };

    const setSequence = (newSequence) => {
        const newTemplate = {
            ...template,
            values: [
                ...template.values.map((value, index) => {
                    if (value.lang === language) {
                        return {
                            ...template.values[index],
                            sequence: [...newSequence],
                        };
                    }
                    return value;
                }),
            ],
        };
        setTemplate(newTemplate);
        updateResponse(newTemplate);
    };

    useEffect(() => {
        removeNewState();
        if (!/^(utter_)/.test(name)) return;
        getResponse(name, (err, res) => {
            if (!err) {
                setTemplate(res);
            }
        });
    }, [language]);

    const handleDeleteResponse = (index) => {
        const newSequence = [...getSequence()];
        newSequence.splice(index, 1);
        if (!newSequence.length) {
            onDeleteAllResponses();
            return;
        }
        setSequence(newSequence);
    };

    const handleChangeResponse = (newContent, index, enter) => {
        setFocus(null);
        const sequence = [...getSequence()];
        const oldContent = yamlLoad(sequence[index].content);
        if (
            newContent.text !== undefined
            && newContent.text.trim() === ''
            && (!oldContent.buttons || !oldContent.buttons.length)
        ) return handleDeleteResponse(index);
        sequence[index].content = yamlDump({ ...oldContent, ...newContent });
        setSequence(sequence);
        if (enter) addNewResponse();
        return true;
    };

    const renderResponse = (response, index, sequenceArray) => {
        const content = yamlLoad(response.content);
        return (
            <React.Fragment key={index}>
                <div className='flex-right'>
                    <BotResponseContainer
                        deletable={deletable || sequenceArray.length > 1}
                        value={content}
                        onDelete={() => handleDeleteResponse(index)}
                        onAbort={() => { }}
                        onChange={(newContent, enter) => handleChangeResponse(newContent, index, enter)
                        }
                        focus={focus === index}
                        onFocus={() => setFocus(index)}
                    />
                    {index === sequenceArray.length - 1 && (
                        <div className='response-name'>{name}</div>)}
                </div>

            </React.Fragment>
        );
    };

    const isSequence = () => {
        // eslint-disable-next-line curly
        if (
            template
            && template.values
            && template.values[0]
            && template.values[0].sequence
        ) return template.values[0].sequence.length > 1;
        return false;
    };
    // if (sequence && !sequence.length) onDeleteAllResponses();
    return (
        <ExceptionWrapper
            exceptions={
                isSequence()
                    ? [
                        ...exceptions,
                        {
                            type: 'warning',
                            message:
                                'Support for message sequences will be removed in the next version, please create a new bot utterance for each item of your sequence.',
                        },
                    ]
                    : exceptions
            }
        >
            <div className={`responses-container exception-wrapper ${isSequence() ? 'multiple' : ''}`}>
                {!template && (
                    <Placeholder>
                        <Placeholder.Line />
                        <Placeholder.Line />
                    </Placeholder>
                )}
                {getSequence().map(renderResponse)}
                {deletable && isSequence() && (
                    <FloatingIconButton icon='trash' onClick={onDeleteAllResponses} />
                )}
            </div>
        </ExceptionWrapper>
    );
};

BotResponsesContainer.propTypes = {
    deletable: PropTypes.bool,
    name: PropTypes.string.isRequired,
    onDeleteAllResponses: PropTypes.func.isRequired,
    exceptions: PropTypes.array,
    isNew: PropTypes.bool.isRequired,
    removeNewState: PropTypes.func.isRequired,
    language: PropTypes.string.isRequired,
    addNewResponse: PropTypes.func.isRequired,
};

BotResponsesContainer.defaultProps = {
    deletable: true,
    exceptions: [{ type: null }],
};

export default BotResponsesContainer;
