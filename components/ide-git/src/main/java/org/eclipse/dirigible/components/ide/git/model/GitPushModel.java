/*
 * Copyright (c) 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.dirigible.components.ide.git.model;

import io.swagger.annotations.ApiModelProperty;

/**
 * The Git Push Model.
 */
public class GitPushModel extends BaseGitProjectModel {

	/** The commit message. */
	@ApiModelProperty(value = "The Commit Message", required = true, example = "Updates README.md")
	private String commitMessage;
	
	/** The auto add. */
	@ApiModelProperty(value = "Add all unstaged files", required = true, example = "Updates README.md")
	private boolean autoAdd;
	
	/** The auto commit. */
	@ApiModelProperty(value = "Commit all staged files", required = true, example = "Updates README.md")
	private boolean autoCommit;
	
	

	/**
	 * Gets the commit message.
	 *
	 * @return the commit message
	 */
	public String getCommitMessage() {
		return commitMessage;
	}

	/**
	 * Sets the commit message.
	 *
	 * @param commitMessage the new commit message
	 */
	public void setCommitMessage(String commitMessage) {
		this.commitMessage = commitMessage;
	}

	/**
	 * Checks if is auto add.
	 *
	 * @return the autoAdd
	 */
	public boolean isAutoAdd() {
		return autoAdd;
	}

	/**
	 * Sets the auto add.
	 *
	 * @param autoAdd the autoAdd to set
	 */
	public void setAutoAdd(boolean autoAdd) {
		this.autoAdd = autoAdd;
	}

	/**
	 * Checks if is auto commit.
	 *
	 * @return the autoCommit
	 */
	public boolean isAutoCommit() {
		return autoCommit;
	}

	/**
	 * Sets the auto commit.
	 *
	 * @param autoCommit the autoCommit to set
	 */
	public void setAutoCommit(boolean autoCommit) {
		this.autoCommit = autoCommit;
	}
	
	

}
